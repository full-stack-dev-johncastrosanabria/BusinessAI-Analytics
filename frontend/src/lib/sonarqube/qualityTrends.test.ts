/**
 * Tests for qualityTrends.ts
 */

import { describe, it, expect } from 'vitest';
import type { QualityMetrics } from './types';
import {
  ratingToNumeric,
  parseTechnicalDebtMinutes,
  calculateTrendDirection,
  calculateChangePercent,
  buildNumericTrend,
  buildRatingTrend,
  analyzeHistoricalTrends,
  totalIssueCount,
} from './qualityTrends';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeMetrics(overrides: Partial<QualityMetrics> = {}): QualityMetrics {
  return {
    projectKey: 'test',
    timestamp: new Date('2024-01-01'),
    overallRating: 'B',
    maintainabilityRating: 'B',
    reliabilityRating: 'A',
    securityRating: 'A',
    coverage: 80,
    duplicatedLinesDensity: 2,
    linesOfCode: 1000,
    technicalDebt: 'PT1H30M',
    issues: { blocker: 0, critical: 1, major: 2, minor: 3, info: 4 },
    qualityGateStatus: 'PASSED',
    ...overrides,
  };
}

// ─── ratingToNumeric ──────────────────────────────────────────────────────────

describe('ratingToNumeric', () => {
  it('maps A to 1', () => expect(ratingToNumeric('A')).toBe(1));
  it('maps E to 5', () => expect(ratingToNumeric('E')).toBe(5));
  it('maps all ratings in order', () => {
    expect(['A', 'B', 'C', 'D', 'E'].map(r => ratingToNumeric(r as any))).toEqual([1, 2, 3, 4, 5]);
  });
});

// ─── parseTechnicalDebtMinutes ────────────────────────────────────────────────

describe('parseTechnicalDebtMinutes', () => {
  it('parses hours and minutes', () => expect(parseTechnicalDebtMinutes('PT2H30M')).toBe(150));
  it('parses hours only', () => expect(parseTechnicalDebtMinutes('PT3H')).toBe(180));
  it('parses minutes only', () => expect(parseTechnicalDebtMinutes('PT45M')).toBe(45));
  it('returns 0 for empty duration', () => expect(parseTechnicalDebtMinutes('PT')).toBe(0));
});

// ─── calculateTrendDirection ──────────────────────────────────────────────────

describe('calculateTrendDirection', () => {
  it('returns stable for single value', () => {
    expect(calculateTrendDirection([50])).toBe('stable');
  });

  it('returns stable when change < 1%', () => {
    expect(calculateTrendDirection([100, 100.5])).toBe('stable');
  });

  it('returns improving when higher is better and value increases', () => {
    expect(calculateTrendDirection([60, 80], true)).toBe('improving');
  });

  it('returns degrading when higher is better and value decreases', () => {
    expect(calculateTrendDirection([80, 60], true)).toBe('degrading');
  });

  it('returns improving when lower is better and value decreases', () => {
    expect(calculateTrendDirection([10, 5], false)).toBe('improving');
  });

  it('returns degrading when lower is better and value increases', () => {
    expect(calculateTrendDirection([5, 10], false)).toBe('degrading');
  });
});

// ─── calculateChangePercent ───────────────────────────────────────────────────

describe('calculateChangePercent', () => {
  it('returns 0 for single value', () => expect(calculateChangePercent([50])).toBe(0));
  it('returns 0 when first value is 0', () => expect(calculateChangePercent([0, 10])).toBe(0));
  it('calculates positive change', () => expect(calculateChangePercent([50, 75])).toBe(50));
  it('calculates negative change', () => expect(calculateChangePercent([100, 80])).toBe(-20));
});

// ─── totalIssueCount ──────────────────────────────────────────────────────────

describe('totalIssueCount', () => {
  it('sums all issue severities', () => {
    const m = makeMetrics({ issues: { blocker: 1, critical: 2, major: 3, minor: 4, info: 5 } });
    expect(totalIssueCount(m)).toBe(15);
  });

  it('returns 0 when no issues', () => {
    const m = makeMetrics({ issues: { blocker: 0, critical: 0, major: 0, minor: 0, info: 0 } });
    expect(totalIssueCount(m)).toBe(0);
  });
});

// ─── buildNumericTrend ────────────────────────────────────────────────────────

describe('buildNumericTrend', () => {
  it('builds data points from snapshots', () => {
    const snapshots = [
      makeMetrics({ coverage: 70, timestamp: new Date('2024-01-01') }),
      makeMetrics({ coverage: 80, timestamp: new Date('2024-02-01') }),
    ];
    const trend = buildNumericTrend(snapshots, m => m.coverage, true);
    expect(trend.dataPoints).toHaveLength(2);
    expect(trend.dataPoints[0].value).toBe(70);
    expect(trend.dataPoints[1].value).toBe(80);
    expect(trend.direction).toBe('improving');
  });
});

// ─── buildRatingTrend ─────────────────────────────────────────────────────────

describe('buildRatingTrend', () => {
  it('detects improving rating trend (A to B is degrading, B to A is improving)', () => {
    const snapshots = [
      makeMetrics({ maintainabilityRating: 'C', timestamp: new Date('2024-01-01') }),
      makeMetrics({ maintainabilityRating: 'A', timestamp: new Date('2024-02-01') }),
    ];
    const trend = buildRatingTrend(snapshots, m => m.maintainabilityRating);
    expect(trend.direction).toBe('improving');
  });

  it('detects degrading rating trend', () => {
    const snapshots = [
      makeMetrics({ maintainabilityRating: 'A', timestamp: new Date('2024-01-01') }),
      makeMetrics({ maintainabilityRating: 'D', timestamp: new Date('2024-02-01') }),
    ];
    const trend = buildRatingTrend(snapshots, m => m.maintainabilityRating);
    expect(trend.direction).toBe('degrading');
  });
});

// ─── analyzeHistoricalTrends ──────────────────────────────────────────────────

describe('analyzeHistoricalTrends', () => {
  it('returns all trend categories', () => {
    const snapshots = [
      makeMetrics({ timestamp: new Date('2024-01-01') }),
      makeMetrics({ coverage: 90, timestamp: new Date('2024-02-01') }),
    ];
    const result = analyzeHistoricalTrends(snapshots);
    expect(result).toHaveProperty('coverage');
    expect(result).toHaveProperty('technicalDebt');
    expect(result).toHaveProperty('maintainability');
    expect(result).toHaveProperty('reliability');
    expect(result).toHaveProperty('security');
    expect(result).toHaveProperty('totalIssues');
  });

  it('handles empty snapshots gracefully', () => {
    const result = analyzeHistoricalTrends([]);
    expect(result.coverage.direction).toBe('stable');
    expect(result.coverage.dataPoints).toHaveLength(0);
  });
});
