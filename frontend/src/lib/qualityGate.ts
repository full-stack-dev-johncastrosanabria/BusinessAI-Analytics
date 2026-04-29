/**
 * Quality Gate Enforcement Logic
 *
 * Implements the Quality_Gate enforcement rules as defined in the SonarQube
 * quality gate configuration (docs/sonarqube-quality-gates.md).
 *
 * Thresholds:
 *   - New Blocker Issues: 0 (any blocker → FAILED)
 *   - New Critical Issues: 0 (any critical → FAILED)
 *   - Security Rating: A (no vulnerabilities)
 *   - Maintainability Rating: A (technical debt ratio <= 5%)
 *   - Reliability Rating: A (no bugs)
 *   - Line Coverage: >= 80%
 *   - Duplicated Lines Density: <= 3%
 */

export type Severity = 'BLOCKER' | 'CRITICAL' | 'MAJOR' | 'MINOR' | 'INFO';
export type Rating = 'A' | 'B' | 'C' | 'D' | 'E';
export type QualityGateStatus = 'PASSED' | 'FAILED';

export interface IssueCount {
  blocker: number;
  critical: number;
  major: number;
  minor: number;
  info: number;
}

export interface QualityGateInput {
  issues: IssueCount;
  coverage: number;           // percentage 0–100
  duplicatedLinesDensity: number; // percentage 0–100
  securityRating: Rating;
  maintainabilityRating: Rating;
  reliabilityRating: Rating;
}

export interface QualityGateResult {
  status: QualityGateStatus;
  failedConditions: string[];
}

/**
 * Evaluates whether a submission passes the quality gate.
 *
 * The gate FAILS if ANY of the following conditions are violated:
 *   1. blocker issues > 0
 *   2. critical issues > 0
 *   3. coverage < 80%
 *   4. duplicatedLinesDensity > 3%
 *   5. securityRating !== 'A'
 *   6. maintainabilityRating !== 'A'
 *   7. reliabilityRating !== 'A'
 */
export function evaluateQualityGate(input: QualityGateInput): QualityGateResult {
  const failedConditions: string[] = [];

  if (input.issues.blocker > 0) {
    failedConditions.push(`Blocker issues: ${input.issues.blocker} (threshold: 0)`);
  }

  if (input.issues.critical > 0) {
    failedConditions.push(`Critical issues: ${input.issues.critical} (threshold: 0)`);
  }

  if (input.coverage < 80) {
    failedConditions.push(`Coverage: ${input.coverage}% (threshold: >= 80%)`);
  }

  if (input.duplicatedLinesDensity > 3) {
    failedConditions.push(
      `Duplicated lines density: ${input.duplicatedLinesDensity}% (threshold: <= 3%)`
    );
  }

  if (input.securityRating !== 'A') {
    failedConditions.push(`Security rating: ${input.securityRating} (threshold: A)`);
  }

  if (input.maintainabilityRating !== 'A') {
    failedConditions.push(`Maintainability rating: ${input.maintainabilityRating} (threshold: A)`);
  }

  if (input.reliabilityRating !== 'A') {
    failedConditions.push(`Reliability rating: ${input.reliabilityRating} (threshold: A)`);
  }

  return {
    status: failedConditions.length === 0 ? 'PASSED' : 'FAILED',
    failedConditions,
  };
}

/**
 * Returns true when the submission has zero issues of blocking severity
 * (i.e., no BLOCKER or CRITICAL issues).
 */
export function hasNoBlockingSeverityIssues(issues: IssueCount): boolean {
  return issues.blocker === 0 && issues.critical === 0;
}
