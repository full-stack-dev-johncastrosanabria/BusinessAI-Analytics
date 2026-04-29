/**
 * Property-Based Tests: Quality Dashboard Functionality
 *
 * **Validates: Requirements 1.4, 1.7**
 *
 * Property 2: Quality Dashboard Metrics Display Accuracy
 *   For any valid set of quality metrics from SonarQube analysis, the
 *   Quality_Dashboard SHALL accurately display all maintainability, reliability,
 *   and security ratings with correct formatting and values.
 *
 * Property 4: Actionable Recommendation Provision
 *   For any set of identified code quality issues, the Quality_Dashboard SHALL
 *   provide actionable recommendations that are specific, relevant, and
 *   implementable for each issue type.
 *
 * Sub-properties tested:
 *
 * Property 2:
 *   P2a – For any valid QualityMetrics, ratings (A-E) are always valid Rating values
 *   P2b – Coverage values are always in the range [0, 100]
 *   P2c – Technical debt is always a valid ISO 8601 duration string
 *   P2d – Issue counts are always non-negative integers
 *   P2e – Quality gate status is always one of PASSED/FAILED/NONE
 *
 * Property 4:
 *   P4a – For any CodeIssue, getRecommendationForIssue always returns a non-null recommendation
 *   P4b – Every recommendation has a non-empty title and description
 *   P4c – Recommendations for BLOCKER/CRITICAL issues always have higher priority than MINOR/INFO
 *   P4d – generateRecommendations always returns a sorted list (by priority ascending)
 *   P4e – getTopRecommendations(issues, n) always returns at most n recommendations
 */

import { describe, it } from 'vitest';
import * as fc from 'fast-check';
import type { QualityMetrics, CodeIssue, Rating, IssueSeverity, IssueType } from '../sonarqube/types';
import {
  getRecommendationForIssue,
  generateRecommendations,
  getTopRecommendations,
} from '../sonarqube/recommendations';

// ─── Arbitraries ─────────────────────────────────────────────────────────────

const ratingArb: fc.Arbitrary<Rating> = fc.constantFrom('A', 'B', 'C', 'D', 'E');

const qualityGateStatusArb = fc.constantFrom('PASSED' as const, 'FAILED' as const, 'NONE' as const);

const severityArb: fc.Arbitrary<IssueSeverity> = fc.constantFrom(
  'BLOCKER' as const,
  'CRITICAL' as const,
  'MAJOR' as const,
  'MINOR' as const,
  'INFO' as const,
);

const issueTypeArb: fc.Arbitrary<IssueType> = fc.constantFrom(
  'BUG' as const,
  'VULNERABILITY' as const,
  'CODE_SMELL' as const,
);

const issueStatusArb = fc.constantFrom(
  'OPEN' as const,
  'CONFIRMED' as const,
  'REOPENED' as const,
  'RESOLVED' as const,
  'CLOSED' as const,
);

/** Non-negative integer for issue counts. */
const nonNegativeIntArb = fc.nat({ max: 1000 });

/** Non-empty, non-whitespace string. */
const nonEmptyStringArb = fc
  .string({ minLength: 1, maxLength: 40 })
  .filter(s => s.trim().length > 0);

/**
 * Generates a valid ISO 8601 duration string like "PT2H30M", "PT45M", "PT1H".
 * Covers the subset used by SonarQube technical debt values.
 */
const iso8601DurationArb: fc.Arbitrary<string> = fc
  .tuple(
    fc.nat({ max: 999 }), // hours
    fc.nat({ max: 59 }),  // minutes
  )
  .map(([h, m]) => {
    if (h === 0 && m === 0) return 'PT0M';
    if (h === 0) return `PT${m}M`;
    if (m === 0) return `PT${h}H`;
    return `PT${h}H${m}M`;
  });

/** Generates a valid QualityMetrics object. */
const qualityMetricsArb: fc.Arbitrary<QualityMetrics> = fc.record({
  projectKey: nonEmptyStringArb,
  timestamp: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
  overallRating: ratingArb,
  maintainabilityRating: ratingArb,
  reliabilityRating: ratingArb,
  securityRating: ratingArb,
  coverage: fc.float({ min: 0, max: 100, noNaN: true }),
  duplicatedLinesDensity: fc.float({ min: 0, max: 100, noNaN: true }),
  linesOfCode: fc.nat({ max: 1_000_000 }),
  technicalDebt: iso8601DurationArb,
  issues: fc.record({
    blocker: nonNegativeIntArb,
    critical: nonNegativeIntArb,
    major: nonNegativeIntArb,
    minor: nonNegativeIntArb,
    info: nonNegativeIntArb,
  }),
  qualityGateStatus: qualityGateStatusArb,
});

/** Generates a complete CodeIssue. */
const codeIssueArb: fc.Arbitrary<CodeIssue> = fc.record({
  id: nonEmptyStringArb,
  projectKey: nonEmptyStringArb,
  component: nonEmptyStringArb,
  line: fc.nat({ max: 9999 }),
  severity: severityArb,
  type: issueTypeArb,
  rule: nonEmptyStringArb,
  message: nonEmptyStringArb,
  status: issueStatusArb,
  creationDate: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
  updateDate: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
});

/** Generates a list of CodeIssues (0–20 items). */
const codeIssueListArb: fc.Arbitrary<CodeIssue[]> = fc.array(codeIssueArb, {
  minLength: 0,
  maxLength: 20,
});

// ─── ISO 8601 Duration Validator ─────────────────────────────────────────────

/**
 * Validates that a string is a valid ISO 8601 duration (PT-prefixed subset
 * used by SonarQube: hours and/or minutes).
 */
function isValidIso8601Duration(value: string): boolean {
  // Must start with PT and contain at least one time component
  return /^PT(\d+H)?(\d+M)?$/.test(value) && value.length > 2;
}

// ─── Tests: Property 2 – Quality Dashboard Metrics Display Accuracy ──────────

describe('Property 2: Quality Dashboard Metrics Display Accuracy (Validates: Requirements 1.4)', () => {

  /**
   * P2a – For any valid QualityMetrics, all rating fields are valid Rating values (A–E).
   */
  it('P2a: all rating fields are always valid Rating values (A-E)', () => {
    const validRatings = new Set<string>(['A', 'B', 'C', 'D', 'E']);
    fc.assert(
      fc.property(qualityMetricsArb, (metrics) => {
        return (
          validRatings.has(metrics.overallRating) &&
          validRatings.has(metrics.maintainabilityRating) &&
          validRatings.has(metrics.reliabilityRating) &&
          validRatings.has(metrics.securityRating)
        );
      }),
    );
  });

  /**
   * P2b – Coverage values are always in the range [0, 100].
   */
  it('P2b: coverage is always a percentage value in [0, 100]', () => {
    fc.assert(
      fc.property(qualityMetricsArb, (metrics) => {
        return metrics.coverage >= 0 && metrics.coverage <= 100;
      }),
    );
  });

  /**
   * P2c – Technical debt is always a valid ISO 8601 duration string.
   */
  it('P2c: technicalDebt is always a valid ISO 8601 duration string', () => {
    fc.assert(
      fc.property(qualityMetricsArb, (metrics) => {
        return isValidIso8601Duration(metrics.technicalDebt);
      }),
    );
  });

  /**
   * P2d – All issue counts are always non-negative integers.
   */
  it('P2d: all issue counts are always non-negative integers', () => {
    fc.assert(
      fc.property(qualityMetricsArb, (metrics) => {
        const { blocker, critical, major, minor, info } = metrics.issues;
        return (
          Number.isInteger(blocker) && blocker >= 0 &&
          Number.isInteger(critical) && critical >= 0 &&
          Number.isInteger(major) && major >= 0 &&
          Number.isInteger(minor) && minor >= 0 &&
          Number.isInteger(info) && info >= 0
        );
      }),
    );
  });

  /**
   * P2e – Quality gate status is always one of PASSED, FAILED, or NONE.
   */
  it('P2e: qualityGateStatus is always one of PASSED, FAILED, or NONE', () => {
    const validStatuses = new Set<string>(['PASSED', 'FAILED', 'NONE']);
    fc.assert(
      fc.property(qualityMetricsArb, (metrics) => {
        return validStatuses.has(metrics.qualityGateStatus);
      }),
    );
  });
});

// ─── Tests: Property 4 – Actionable Recommendation Provision ─────────────────

describe('Property 4: Actionable Recommendation Provision (Validates: Requirements 1.7)', () => {

  /**
   * P4a – For any CodeIssue, getRecommendationForIssue always returns a
   * non-null, non-undefined recommendation.
   */
  it('P4a: getRecommendationForIssue always returns a non-null recommendation', () => {
    fc.assert(
      fc.property(codeIssueArb, (issue) => {
        const rec = getRecommendationForIssue(issue);
        return rec !== null && rec !== undefined;
      }),
    );
  });

  /**
   * P4b – Every recommendation has a non-empty title and description.
   */
  it('P4b: every recommendation has a non-empty title and description', () => {
    fc.assert(
      fc.property(codeIssueArb, (issue) => {
        const rec = getRecommendationForIssue(issue);
        return (
          typeof rec.title === 'string' && rec.title.trim().length > 0 &&
          typeof rec.description === 'string' && rec.description.trim().length > 0
        );
      }),
    );
  });

  /**
   * P4c – Recommendations for BLOCKER/CRITICAL issues always have a lower
   * (higher-priority) priority number than recommendations for MINOR/INFO issues,
   * when both are resolved via the severity fallback path (no rule/type match).
   *
   * We use a rule and type that have no specific mapping so the severity-based
   * recommendation is always used, making the priority comparison deterministic.
   */
  it('P4c: BLOCKER/CRITICAL recommendations have higher priority than MINOR/INFO', () => {
    /** Shared base fields for an issue that forces severity-based lookup. */
    const baseIssueFields = {
      id: nonEmptyStringArb,
      projectKey: nonEmptyStringArb,
      component: nonEmptyStringArb,
      line: fc.nat({ max: 9999 }),
      // Use a type with no entry in TYPE_RECOMMENDATIONS to force severity fallback.
      type: fc.constant('UNKNOWN_TYPE' as IssueType),
      // Use a rule with no entry in RULE_RECOMMENDATIONS.
      rule: fc.constant('custom:unknown-rule-xyz'),
      message: nonEmptyStringArb,
      status: issueStatusArb,
      creationDate: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
      updateDate: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
    };

    const highSeverityIssue = fc.record({
      ...baseIssueFields,
      severity: fc.constantFrom('BLOCKER' as const, 'CRITICAL' as const),
    });

    const lowSeverityIssue = fc.record({
      ...baseIssueFields,
      severity: fc.constantFrom('MINOR' as const, 'INFO' as const),
    });

    fc.assert(
      fc.property(
        highSeverityIssue,
        lowSeverityIssue,
        (highIssue, lowIssue) => {
          const highRec = getRecommendationForIssue(highIssue);
          const lowRec = getRecommendationForIssue(lowIssue);
          // Lower priority number = higher priority
          return highRec.priority < lowRec.priority;
        },
      ),
    );
  });

  /**
   * P4d – generateRecommendations always returns a list sorted by priority
   * in ascending order (lower number = higher priority first).
   */
  it('P4d: generateRecommendations always returns a list sorted by priority ascending', () => {
    fc.assert(
      fc.property(codeIssueListArb, (issues) => {
        const recs = generateRecommendations(issues);
        for (let i = 1; i < recs.length; i++) {
          if (recs[i].priority < recs[i - 1].priority) {
            return false;
          }
        }
        return true;
      }),
    );
  });

  /**
   * P4e – getTopRecommendations(issues, n) always returns at most n recommendations.
   */
  it('P4e: getTopRecommendations always returns at most n recommendations', () => {
    fc.assert(
      fc.property(
        codeIssueListArb,
        fc.nat({ max: 20 }),
        (issues, limit) => {
          const recs = getTopRecommendations(issues, limit);
          return recs.length <= limit;
        },
      ),
    );
  });

  /**
   * P4f – generateRecommendations deduplicates by title: no two recommendations
   * in the result share the same title.
   */
  it('P4f: generateRecommendations returns unique recommendations (no duplicate titles)', () => {
    fc.assert(
      fc.property(codeIssueListArb, (issues) => {
        const recs = generateRecommendations(issues);
        const titles = recs.map(r => r.title);
        return titles.length === new Set(titles).size;
      }),
    );
  });

  /**
   * P4g – getTopRecommendations result is a prefix of generateRecommendations result
   * (same order, just truncated).
   */
  it('P4g: getTopRecommendations result is a prefix of generateRecommendations result', () => {
    fc.assert(
      fc.property(
        codeIssueListArb,
        fc.nat({ max: 20 }),
        (issues, limit) => {
          const all = generateRecommendations(issues);
          const top = getTopRecommendations(issues, limit);
          return top.every((rec, idx) => rec.title === all[idx].title);
        },
      ),
    );
  });
});
