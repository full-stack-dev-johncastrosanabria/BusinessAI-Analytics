/**
 * Unit tests for qualityTrends.ts
 * Covers: calculateTrendDirection, calculateChangePercent, parseTechnicalDebtMinutes,
 *         ratingToNumeric, buildNumericTrend, buildRatingTrend, analyzeHistoricalTrends
 */

import { describe, it, expect } from 'vitest';
import {
  calculateTrendDirection,
  calculateChangePercent,
  parseTechnicalDebtMinutes,
  ratingToNumeric,
  buildNumericTrend,
  buildRatingTrend,
  analyzeHistoricalTrends,
} from '../qualityTrends';
import type { QualityMetrics, Rating } from '../types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeSnapshot(overrides: Partial<QualityMetrics> = {}): QualityMetrics {
  return {
    projectKey: 'test',
    timestamp: new Date('2024-01-01'),
    overallRating: 'A',
    maintainabilityRating: 'A',
    reliabilityRating: 'A',
    securityRating: 'A',
    coverage: 80,
    duplicatedLinesDensity: 2,
    linesOfCode: 1000,
    technicalDebt: 'PT0M',
    issues: { blocker: 0, critical: 0, major: 0, minor: 0, info: 0 },
    qualityGateStatus: 'PASSED',
    ...overrides,
  };
}

// ─── ratingToNumeric ──────────────────────────────────────────────────────────

describe('ratingToNumeric', () => {
  it('maps A to 1', () => expect(ratingToNumeric('A')).toBe(1));
  it('maps B to 2', () => expect(ratingToNumeric('B')).toBe(2));
  it('maps C to 3', () => expect(ratingToNumeric('C')).toBe(3));
  it('maps D to 4', () => expect(ratingToNumeric('D')).toBe(4));
  it('maps E to 5', () => expect(ratingToNumeric('E')).toBe(5));
});

// ─── parseTechnicalDebtMinutes ────────────────────────────────────────────────

describe('parseTechnicalDebtMinutes', () => {
  it('parses hours and minutes', () => {
    expect(parseTechnicalDebtMinutes('PT2H30M')).toBe(150);
  });

  it('parses hours only', () => {
    expect(parseTechnicalDebtMinutes('PT3H')).toBe(180);
  });

  it('parses minutes only', () => {
    expect(parseTechnicalDebtMinutes('PT45M')).toBe(45);
  });

  it('returns 0 for zero duration', () => {
    expect(parseTechnicalDebtMinutes('PT0M')).toBe(0);
  });

  it('returns 0 for empty-ish string with no H or M', () => {
    expect(parseTechnicalDebtMinutes('PT')).toBe(0);
  });

  it('handles large values', () => {
    expect(parseTechnicalDebtMinutes('PT100H59M')).toBe(6059);
  });
});

// ─── calculateTrendDirection ──────────────────────────────────────────────────

describe('calculateTrendDirection', () => {
  it('returns stable for a single value', () => {
    expect(calculateTrendDirection([50])).toBe('stable');
  });

  it('returns stable when change is less than 1%', () => {
    expect(calculateTrendDirection([100, 100.5])).toBe('stable');
  });

  it('returns stable when both values are 0', () => {
    expect(calculateTrendDirection([0, 0])).toBe('stable');
  });

  it('returns improving when higher is better and value increases', () => {
    expect(calculateTrendDirection([60, 80], true)).toBe('improving');
  });

  it('returns degrading when higher is better and value decreases', () => {
    expect(calculateTrendDirection([80, 60], true)).toBe('degrading');
  });

  it('returns improving when lower is better and value decreases', () => {
    expect(calculateTrendDirection([100, 50], false)).toBe('improving');
  });

  it('returns degrading when lower is better and value increases', () => {
    expect(calculateTrendDirection([50, 100], false)).toBe('degrading');
  });

  it('uses first and last values only (ignores middle)', () => {
    // first=60, last=80 → improving (higher is better)
    expect(calculateTrendDirection([60, 10, 5, 80], true)).toBe('improving');
  });

  it('handles first value of 0 with non-zero last (treats as 100% change)', () => {
    // first=0, last=50 → changePercent=100 → improving (higher is better)
    expect(calculateTrendDirection([0, 50], true)).toBe('improving');
  });
});

// ─── calculateChangePercent ───────────────────────────────────────────────────

describe('calculateChangePercent', () => {
  it('returns 0 for fewer than 2 values', () => {
    expect(calculateChangePercent([])).toBe(0);
    expect(calculateChangePercent([50])).toBe(0);
  });

  it('returns 0 when first value is 0', () => {
    expect(calculateChangePercent([0, 100])).toBe(0);
  });

  it('calculates positive change correctly', () => {
    expect(calculateChangePercent([50, 75])).toBeCloseTo(50);
  });

  it('calculates negative change correctly', () => {
    expect(calculateChangePercent([100, 80])).toBeCloseTo(-20);
  });

  it('calculates 0% change when values are equal', () => {
    expect(calculateChangePercent([70, 70])).toBe(0);
  });

  it('uses absolute value of first for negative first values', () => {
    // first=-100, last=-50 → ((-50 - -100) / 100) * 100 = 50%
    expect(calculateChangePercent([-100, -50])).toBeCloseTo(50);
  });
});

// ─── buildNumericTrend ────────────────────────────────────────────────────────

describe('buildNumericTrend', () => {
  const snapshots: QualityMetrics[] = [
    makeSnapshot({ timestamp: new Date('2024-01-01'), coverage: 60 }),
    makeSnapshot({ timestamp: new Date('2024-02-01'), coverage: 70 }),
    makeSnapshot({ timestamp: new Date('2024-03-01'), coverage: 80 }),
  ];

  it('builds correct number of data points', () => {
    const trend = buildNumericTrend(snapshots, m => m.coverage);
    expect(trend.dataPoints).toHaveLength(3);
  });

  it('extracts values via accessor', () => {
    const trend = buildNumericTrend(snapshots, m => m.coverage);
    expect(trend.dataPoints.map(p => p.value)).toEqual([60, 70, 80]);
  });

  it('sets direction to improving when coverage increases (higherIsBetter=true)', () => {
    const trend = buildNumericTrend(snapshots, m => m.coverage, true);
    expect(trend.direction).toBe('improving');
  });

  it('sets direction to degrading when lower is better and value increases', () => {
    const debtSnapshots: QualityMetrics[] = [
      makeSnapshot({ timestamp: new Date('2024-01-01'), technicalDebt: 'PT1H' }),
      makeSnapshot({ timestamp: new Date('2024-02-01'), technicalDebt: 'PT2H' }),
    ];
    const trend = buildNumericTrend(debtSnapshots, m => parseTechnicalDebtMinutes(m.technicalDebt), false);
    expect(trend.direction).toBe('degrading');
  });

  it('calculates changePercent correctly', () => {
    const trend = buildNumericTrend(snapshots, m => m.coverage);
    // (80 - 60) / 60 * 100 ≈ 33.33%
    expect(trend.changePercent).toBeCloseTo(33.33, 1);
  });

  it('returns stable trend for single snapshot', () => {
    const trend = buildNumericTrend([snapshots[0]], m => m.coverage);
    expect(trend.direction).toBe('stable');
    expect(trend.changePercent).toBe(0);
  });

  it('returns empty dataPoints for empty snapshots', () => {
    const trend = buildNumericTrend([], m => m.coverage);
    expect(trend.dataPoints).toHaveLength(0);
    expect(trend.direction).toBe('stable');
  });
});

// ─── buildRatingTrend ─────────────────────────────────────────────────────────

describe('buildRatingTrend', () => {
  it('maps ratings to numeric values in dataPoints', () => {
    const snapshots: QualityMetrics[] = [
      makeSnapshot({ timestamp: new Date('2024-01-01'), maintainabilityRating: 'C' }),
      makeSnapshot({ timestamp: new Date('2024-02-01'), maintainabilityRating: 'B' }),
      makeSnapshot({ timestamp: new Date('2024-03-01'), maintainabilityRating: 'A' }),
    ];
    const trend = buildRatingTrend(snapshots, m => m.maintainabilityRating);
    expect(trend.dataPoints.map(p => p.numericValue)).toEqual([3, 2, 1]);
  });

  it('returns improving when rating goes from C to A (numeric 3→1, lower is better)', () => {
    const snapshots: QualityMetrics[] = [
      makeSnapshot({ timestamp: new Date('2024-01-01'), securityRating: 'C' }),
      makeSnapshot({ timestamp: new Date('2024-02-01'), securityRating: 'A' }),
    ];
    const trend = buildRatingTrend(snapshots, m => m.securityRating);
    expect(trend.direction).toBe('improving');
  });

  it('returns degrading when rating goes from A to D', () => {
    const snapshots: QualityMetrics[] = [
      makeSnapshot({ timestamp: new Date('2024-01-01'), reliabilityRating: 'A' }),
      makeSnapshot({ timestamp: new Date('2024-02-01'), reliabilityRating: 'D' }),
    ];
    const trend = buildRatingTrend(snapshots, m => m.reliabilityRating);
    expect(trend.direction).toBe('degrading');
  });

  it('preserves the original rating string in dataPoints', () => {
    const ratings: Rating[] = ['A', 'B', 'C'];
    const snapshots = ratings.map((r, i) =>
      makeSnapshot({ timestamp: new Date(`2024-0${i + 1}-01`), maintainabilityRating: r }),
    );
    const trend = buildRatingTrend(snapshots, m => m.maintainabilityRating);
    expect(trend.dataPoints.map(p => p.rating)).toEqual(['A', 'B', 'C']);
  });
});

// ─── analyzeHistoricalTrends ──────────────────────────────────────────────────

describe('analyzeHistoricalTrends', () => {
  const snapshots: QualityMetrics[] = [
    makeSnapshot({
      timestamp: new Date('2024-01-01'),
      coverage: 60,
      technicalDebt: 'PT2H',
      maintainabilityRating: 'C',
      reliabilityRating: 'B',
      securityRating: 'A',
      issues: { blocker: 2, critical: 3, major: 5, minor: 1, info: 0 },
    }),
    makeSnapshot({
      timestamp: new Date('2024-02-01'),
      coverage: 80,
      technicalDebt: 'PT1H',
      maintainabilityRating: 'A',
      reliabilityRating: 'A',
      securityRating: 'A',
      issues: { blocker: 0, critical: 1, major: 2, minor: 1, info: 0 },
    }),
  ];

  it('returns all six trend keys', () => {
    const result = analyzeHistoricalTrends(snapshots);
    expect(result).toHaveProperty('coverage');
    expect(result).toHaveProperty('technicalDebt');
    expect(result).toHaveProperty('maintainability');
    expect(result).toHaveProperty('reliability');
    expect(result).toHaveProperty('security');
    expect(result).toHaveProperty('totalIssues');
  });

  it('coverage trend is improving when coverage increases', () => {
    const result = analyzeHistoricalTrends(snapshots);
    expect(result.coverage.direction).toBe('improving');
  });

  it('technicalDebt trend is improving when debt decreases', () => {
    const result = analyzeHistoricalTrends(snapshots);
    expect(result.technicalDebt.direction).toBe('improving');
  });

  it('totalIssues trend is improving when issue count decreases', () => {
    const result = analyzeHistoricalTrends(snapshots);
    // 11 issues → 4 issues
    expect(result.totalIssues.direction).toBe('improving');
  });

  it('returns stable trends for a single snapshot', () => {
    const result = analyzeHistoricalTrends([snapshots[0]]);
    expect(result.coverage.direction).toBe('stable');
    expect(result.technicalDebt.direction).toBe('stable');
    expect(result.totalIssues.direction).toBe('stable');
  });

  it('returns empty data points for empty snapshots', () => {
    const result = analyzeHistoricalTrends([]);
    expect(result.coverage.dataPoints).toHaveLength(0);
    expect(result.maintainability.dataPoints).toHaveLength(0);
  });
});
