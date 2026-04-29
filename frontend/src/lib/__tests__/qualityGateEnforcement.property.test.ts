/**
 * Property-Based Test: Quality Gate Enforcement Consistency
 *
 * **Validates: Requirements 1.3**
 *
 * Property 1: For any code submission with quality issues, the Quality_Gate SHALL
 * consistently enforce minimum quality standards by blocking submissions that exceed
 * severity thresholds, regardless of the specific issue types or combinations present.
 *
 * Sub-properties tested:
 *   P1a – Any combination of issues that exceeds severity thresholds results in gate failure
 *   P1b – Enforcement is consistent regardless of issue type combinations
 *   P1c – Submissions with zero issues of blocking severity always pass (when other metrics are clean)
 *   P1d – Submissions with any blocker/critical issues always fail
 */

import { describe, it } from 'vitest'
import * as fc from 'fast-check'
import {
  evaluateQualityGate,
  hasNoBlockingSeverityIssues,
  type IssueCount,
  type QualityGateInput,
  type Rating,
} from '../qualityGate'

// ─── Arbitraries ─────────────────────────────────────────────────────────────

const nonNegativeInt = fc.nat({ max: 100 });

const issueCountArb: fc.Arbitrary<IssueCount> = fc.record({
  blocker: nonNegativeInt,
  critical: nonNegativeInt,
  major: nonNegativeInt,
  minor: nonNegativeInt,
  info: nonNegativeInt,
});

const ratingArb: fc.Arbitrary<Rating> = fc.constantFrom('A', 'B', 'C', 'D', 'E');

const qualityGateInputArb: fc.Arbitrary<QualityGateInput> = fc.record({
  issues: issueCountArb,
  coverage: fc.float({ min: 0, max: 100, noNaN: true }),
  duplicatedLinesDensity: fc.float({ min: 0, max: 100, noNaN: true }),
  securityRating: ratingArb,
  maintainabilityRating: ratingArb,
  reliabilityRating: ratingArb,
});

/** A "clean" input that satisfies all thresholds except possibly the issues field. */
const cleanMetricsArb = fc.record({
  coverage: fc.float({ min: 80, max: 100, noNaN: true }),
  duplicatedLinesDensity: fc.float({ min: 0, max: 3, noNaN: true }),
  securityRating: fc.constant<Rating>('A'),
  maintainabilityRating: fc.constant<Rating>('A'),
  reliabilityRating: fc.constant<Rating>('A'),
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('Property 1: Quality Gate Enforcement Consistency (Validates: Requirements 1.3)', () => {

  /**
   * P1a – Any submission with blocker issues > 0 always fails the gate,
   * regardless of other issue types or combinations.
   */
  it('P1a: any submission with blocker issues always fails', () => {
    fc.assert(
      fc.property(
        fc.nat({ max: 100 }).filter(n => n > 0), // at least 1 blocker
        nonNegativeInt,
        nonNegativeInt,
        nonNegativeInt,
        nonNegativeInt,
        cleanMetricsArb,
        (blockers, critical, major, minor, info, cleanMetrics) => {
          const input: QualityGateInput = {
            ...cleanMetrics,
            issues: { blocker: blockers, critical, major, minor, info },
          };
          const result = evaluateQualityGate(input);
          return result.status === 'FAILED';
        }
      )
    );
  });

  /**
   * P1b – Any submission with critical issues > 0 always fails the gate,
   * regardless of other issue types or combinations.
   */
  it('P1b: any submission with critical issues always fails', () => {
    fc.assert(
      fc.property(
        nonNegativeInt,
        fc.nat({ max: 100 }).filter(n => n > 0), // at least 1 critical
        nonNegativeInt,
        nonNegativeInt,
        nonNegativeInt,
        cleanMetricsArb,
        (blocker, criticals, major, minor, info, cleanMetrics) => {
          const input: QualityGateInput = {
            ...cleanMetrics,
            issues: { blocker, critical: criticals, major, minor, info },
          };
          const result = evaluateQualityGate(input);
          return result.status === 'FAILED';
        }
      )
    );
  });

  /**
   * P1c – Submissions with zero blocker and zero critical issues, combined with
   * all other metrics within thresholds, always pass the gate.
   */
  it('P1c: submissions with zero blocking-severity issues and clean metrics always pass', () => {
    fc.assert(
      fc.property(
        nonNegativeInt, // major – any amount is fine
        nonNegativeInt, // minor
        nonNegativeInt, // info
        cleanMetricsArb,
        (major, minor, info, cleanMetrics) => {
          const input: QualityGateInput = {
            ...cleanMetrics,
            issues: { blocker: 0, critical: 0, major, minor, info },
          };
          const result = evaluateQualityGate(input);
          return result.status === 'PASSED';
        }
      )
    );
  });

  /**
   * P1d – Enforcement is consistent: the gate result is deterministic for the
   * same input regardless of how many times it is evaluated.
   */
  it('P1d: gate evaluation is deterministic for any input', () => {
    fc.assert(
      fc.property(qualityGateInputArb, (input) => {
        const result1 = evaluateQualityGate(input);
        const result2 = evaluateQualityGate(input);
        return result1.status === result2.status;
      })
    );
  });

  /**
   * P1e – The gate fails when coverage drops below 80%, regardless of issue counts.
   */
  it('P1e: insufficient coverage always fails the gate', () => {
    fc.assert(
      fc.property(
        // coverage strictly below 80 – use integer percentages to avoid 32-bit float constraints
        fc.integer({ min: 0, max: 79 }),
        issueCountArb,
        (coverage, issues) => {
          const input: QualityGateInput = {
            issues,
            coverage,
            duplicatedLinesDensity: 0,
            securityRating: 'A',
            maintainabilityRating: 'A',
            reliabilityRating: 'A',
          };
          const result = evaluateQualityGate(input);
          return result.status === 'FAILED';
        }
      )
    );
  });

  /**
   * P1f – The gate fails when duplicated lines density exceeds 3%, regardless of issue counts.
   */
  it('P1f: excessive duplication always fails the gate', () => {
    fc.assert(
      fc.property(
        // density strictly above 3 – use integer percentages to avoid 32-bit float constraints
        fc.integer({ min: 4, max: 100 }),
        issueCountArb,
        (density, issues) => {
          const input: QualityGateInput = {
            issues,
            coverage: 100,
            duplicatedLinesDensity: density,
            securityRating: 'A',
            maintainabilityRating: 'A',
            reliabilityRating: 'A',
          };
          const result = evaluateQualityGate(input);
          return result.status === 'FAILED';
        }
      )
    );
  });

  /**
   * P1g – A non-'A' security/maintainability/reliability rating always fails,
   * regardless of issue combinations.
   */
  it('P1g: non-A ratings always fail the gate regardless of issue combinations', () => {
    const nonARating = fc.constantFrom<Rating>('B', 'C', 'D', 'E');

    fc.assert(
      fc.property(
        issueCountArb,
        nonARating,
        nonARating,
        nonARating,
        (issues, secRating, maintRating, relRating) => {
          const input: QualityGateInput = {
            issues,
            coverage: 100,
            duplicatedLinesDensity: 0,
            securityRating: secRating,
            maintainabilityRating: maintRating,
            reliabilityRating: relRating,
          };
          const result = evaluateQualityGate(input);
          return result.status === 'FAILED';
        }
      )
    );
  });

  /**
   * P1h – hasNoBlockingSeverityIssues correctly identifies submissions with
   * zero blocker and zero critical issues.
   */
  it('P1h: hasNoBlockingSeverityIssues returns true only when blocker=0 and critical=0', () => {
    fc.assert(
      fc.property(issueCountArb, (issues) => {
        const result = hasNoBlockingSeverityIssues(issues);
        const expected = issues.blocker === 0 && issues.critical === 0;
        return result === expected;
      })
    );
  });

  /**
   * P1i – When the gate fails, failedConditions is non-empty; when it passes,
   * failedConditions is empty. The status and conditions are always consistent.
   */
  it('P1i: gate status and failedConditions are always consistent', () => {
    fc.assert(
      fc.property(qualityGateInputArb, (input) => {
        const { status, failedConditions } = evaluateQualityGate(input);
        if (status === 'FAILED') return failedConditions.length > 0;
        return failedConditions.length === 0;
      })
    );
  });
});
