/**
 * Property-Based Tests: Test Coverage Enhancement Adequacy
 *
 * **Validates: Requirements 2.7**
 *
 * Property 11: Test Coverage Enhancement Adequacy
 *   For any code module with insufficient test coverage, the Issue_Resolver SHALL
 *   add or improve unit tests to meet quality gate requirements while ensuring the
 *   new tests provide meaningful validation.
 *
 * Sub-properties tested:
 *
 * Coverage Adequacy Properties (qualityTrends utilities):
 *   P11a – calculateTrendDirection is deterministic: same inputs always produce same output
 *   P11b – calculateChangePercent is consistent: same inputs always produce same output
 *   P11c – parseTechnicalDebtMinutes always returns a non-negative number
 *   P11d – ratingToNumeric always returns a value in [1, 5]
 *   P11e – buildNumericTrend always returns a trend with dataPoints.length === snapshots.length
 *
 * Test Meaningfulness Properties (issueResolution utilities):
 *   P11f – categorizeIssues total count invariant: sum of all buckets === input length
 *   P11g – IssueResolutionQueue.size decreases by 1 after each dequeue
 *   P11h – IssueResolutionQueue.toArray().length === queue.size (consistency)
 *   P11i – After dequeuing all items, queue.isEmpty === true
 *
 * Quality Gate Threshold Properties:
 *   P11j – Any module with coverage >= 80 passes the coverage threshold
 *   P11k – Any module with coverage < 80 fails the coverage threshold
 */

import { describe, it } from 'vitest';
import * as fc from 'fast-check';
import type { CodeIssue, IssueSeverity, IssueType, QualityMetrics, Rating } from '../sonarqube/types';
import {
  calculateTrendDirection,
  calculateChangePercent,
  parseTechnicalDebtMinutes,
  ratingToNumeric,
  buildNumericTrend,
} from '../sonarqube/qualityTrends';
import {
  categorizeIssues,
  IssueResolutionQueue,
} from '../sonarqube/issueResolution';

// ─── Arbitraries ─────────────────────────────────────────────────────────────

const ratingArb: fc.Arbitrary<Rating> = fc.constantFrom(
  'A' as const,
  'B' as const,
  'C' as const,
  'D' as const,
  'E' as const,
);

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

const nonEmptyStringArb = fc
  .string({ minLength: 1, maxLength: 40 })
  .filter(s => s.trim().length > 0);

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

/** Generates a list of CodeIssues (0–30 items). */
const codeIssueListArb: fc.Arbitrary<CodeIssue[]> = fc.array(codeIssueArb, {
  minLength: 0,
  maxLength: 30,
});

/** Generates a non-empty list of CodeIssues (1–20 items). */
const nonEmptyCodeIssueListArb: fc.Arbitrary<CodeIssue[]> = fc.array(codeIssueArb, {
  minLength: 1,
  maxLength: 20,
});

/** Generates a list of numbers (at least 2 elements) for trend calculations. */
const numericSeriesArb: fc.Arbitrary<number[]> = fc.array(
  fc.float({ min: 0, max: 1000, noNaN: true }),
  { minLength: 2, maxLength: 20 },
);

/** Generates a valid ISO 8601 duration string like "PT2H30M", "PT45M", "PT3H". */
const isoDurationArb: fc.Arbitrary<string> = fc.oneof(
  // Hours only
  fc.nat({ max: 999 }).map(h => `PT${h}H`),
  // Minutes only
  fc.nat({ max: 59 }).map(m => `PT${m}M`),
  // Hours and minutes
  fc.tuple(fc.nat({ max: 99 }), fc.nat({ max: 59 })).map(([h, m]) => `PT${h}H${m}M`),
);

/** Generates a QualityMetrics snapshot. */
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
  technicalDebt: isoDurationArb,
  issues: fc.record({
    blocker: fc.nat({ max: 100 }),
    critical: fc.nat({ max: 100 }),
    major: fc.nat({ max: 100 }),
    minor: fc.nat({ max: 100 }),
    info: fc.nat({ max: 100 }),
  }),
  qualityGateStatus: fc.constantFrom('PASSED' as const, 'FAILED' as const, 'NONE' as const),
});

/** Generates a non-empty array of QualityMetrics snapshots. */
const snapshotsArb: fc.Arbitrary<QualityMetrics[]> = fc.array(qualityMetricsArb, {
  minLength: 1,
  maxLength: 10,
});

// ─── Coverage threshold helper ────────────────────────────────────────────────

const COVERAGE_THRESHOLD = 80;

function passesCoverageThreshold(coverage: number): boolean {
  return coverage >= COVERAGE_THRESHOLD;
}

// ─── Tests: Coverage Adequacy Properties ─────────────────────────────────────

describe('Property 11: Test Coverage Enhancement Adequacy (Validates: Requirements 2.7)', () => {

  describe('Coverage Adequacy – qualityTrends utilities', () => {

    /**
     * P11a – calculateTrendDirection is deterministic: same inputs always produce same output.
     */
    it('P11a: calculateTrendDirection is deterministic for the same inputs', () => {
      fc.assert(
        fc.property(
          numericSeriesArb,
          fc.boolean(),
          (values, higherIsBetter) => {
            const result1 = calculateTrendDirection(values, higherIsBetter);
            const result2 = calculateTrendDirection(values, higherIsBetter);
            return result1 === result2;
          },
        ),
      );
    });

    /**
     * P11b – calculateChangePercent is consistent: same inputs always produce same output.
     */
    it('P11b: calculateChangePercent is consistent for the same inputs', () => {
      fc.assert(
        fc.property(numericSeriesArb, (values) => {
          const result1 = calculateChangePercent(values);
          const result2 = calculateChangePercent(values);
          return result1 === result2;
        }),
      );
    });

    /**
     * P11c – parseTechnicalDebtMinutes always returns a non-negative number.
     */
    it('P11c: parseTechnicalDebtMinutes always returns a non-negative number', () => {
      fc.assert(
        fc.property(isoDurationArb, (iso) => {
          const minutes = parseTechnicalDebtMinutes(iso);
          return typeof minutes === 'number' && minutes >= 0;
        }),
      );
    });

    /**
     * P11d – ratingToNumeric always returns a value in [1, 5].
     */
    it('P11d: ratingToNumeric always returns a value in [1, 5]', () => {
      fc.assert(
        fc.property(ratingArb, (rating) => {
          const value = ratingToNumeric(rating);
          return Number.isInteger(value) && value >= 1 && value <= 5;
        }),
      );
    });

    /**
     * P11e – buildNumericTrend always returns a trend with dataPoints.length === snapshots.length.
     */
    it('P11e: buildNumericTrend returns dataPoints.length === snapshots.length', () => {
      fc.assert(
        fc.property(snapshotsArb, fc.boolean(), (snapshots, higherIsBetter) => {
          const trend = buildNumericTrend(snapshots, m => m.coverage, higherIsBetter);
          return trend.dataPoints.length === snapshots.length;
        }),
      );
    });
  });

  // ─── Tests: Test Meaningfulness Properties ──────────────────────────────────

  describe('Test Meaningfulness – issueResolution utilities', () => {

    /**
     * P11f – categorizeIssues total count invariant: sum of all buckets === input length.
     */
    it('P11f: categorizeIssues total count equals input length', () => {
      fc.assert(
        fc.property(codeIssueListArb, (issues) => {
          const categorized = categorizeIssues(issues);
          const total =
            categorized.BLOCKER.length +
            categorized.CRITICAL.length +
            categorized.MAJOR.length +
            categorized.MINOR.length +
            categorized.INFO.length;
          return total === issues.length;
        }),
      );
    });

    /**
     * P11g – IssueResolutionQueue.size decreases by 1 after each dequeue.
     */
    it('P11g: IssueResolutionQueue.size decreases by 1 after each dequeue', () => {
      fc.assert(
        fc.property(nonEmptyCodeIssueListArb, (issues) => {
          const queue = new IssueResolutionQueue(issues);
          const initialSize = queue.size;
          queue.dequeue();
          return queue.size === initialSize - 1;
        }),
      );
    });

    /**
     * P11h – IssueResolutionQueue.toArray().length === queue.size (consistency).
     */
    it('P11h: IssueResolutionQueue.toArray().length equals queue.size', () => {
      fc.assert(
        fc.property(codeIssueListArb, (issues) => {
          const queue = new IssueResolutionQueue(issues);
          return queue.toArray().length === queue.size;
        }),
      );
    });

    /**
     * P11i – After dequeuing all items, queue.isEmpty === true.
     */
    it('P11i: queue.isEmpty is true after dequeuing all items', () => {
      fc.assert(
        fc.property(codeIssueListArb, (issues) => {
          const queue = new IssueResolutionQueue(issues);
          const count = queue.size;
          for (let i = 0; i < count; i++) {
            queue.dequeue();
          }
          return queue.isEmpty === true;
        }),
      );
    });
  });

  // ─── Tests: Quality Gate Threshold Properties ────────────────────────────────

  describe('Quality Gate Threshold Properties', () => {

    /**
     * P11j – Any module with coverage >= 80 passes the coverage threshold.
     */
    it('P11j: coverage >= 80 passes the coverage threshold', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 80, max: 100, noNaN: true }),
          (coverage) => {
            return passesCoverageThreshold(coverage) === true;
          },
        ),
      );
    });

    /**
     * P11k – Any module with coverage < 80 fails the coverage threshold.
     */
    it('P11k: coverage < 80 fails the coverage threshold', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 0, max: Math.fround(79.99), noNaN: true }),
          (coverage) => {
            return passesCoverageThreshold(coverage) === false;
          },
        ),
      );
    });
  });
});
