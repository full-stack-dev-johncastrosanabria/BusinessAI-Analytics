/**
 * Quality Trends Analysis
 *
 * Calculates trend direction and provides data structures for charting
 * historical quality metrics. Supports Requirement 1.4 (real-time metrics
 * display) and Requirement 5.1 (historical trend analysis).
 */

import type { QualityMetrics, Rating } from './types';

export type TrendDirection = 'improving' | 'degrading' | 'stable';

export interface MetricTrendPoint {
  readonly timestamp: Date;
  readonly value: number;
  readonly label: string;
}

export interface RatingTrendPoint {
  readonly timestamp: Date;
  readonly rating: Rating;
  readonly numericValue: number;
  readonly label: string;
}

export interface QualityTrend {
  readonly direction: TrendDirection;
  readonly changePercent: number;
  readonly dataPoints: MetricTrendPoint[];
}

export interface RatingTrend {
  readonly direction: TrendDirection;
  readonly dataPoints: RatingTrendPoint[];
}

export interface HistoricalTrendData {
  readonly coverage: QualityTrend;
  readonly technicalDebt: QualityTrend;
  readonly maintainability: RatingTrend;
  readonly reliability: RatingTrend;
  readonly security: RatingTrend;
  readonly totalIssues: QualityTrend;
}

/** Maps a letter rating to a numeric score (A=1 best, E=5 worst). */
export function ratingToNumeric(rating: Rating): number {
  const map: Record<Rating, number> = { A: 1, B: 2, C: 3, D: 4, E: 5 };
  return map[rating];
}

/** Parses an ISO 8601 duration string (e.g. "PT2H30M") into total minutes. */
export function parseTechnicalDebtMinutes(iso: string): number {
  // SONAR_SAFE: Fixed regex to prevent backtracking vulnerability
  // Original patterns /(\d+)H/ and /(\d+)M/ were vulnerable to polynomial runtime
  // Using string parsing instead of regex for better performance and security
  const hours = parseTimeUnit(iso, 'H');
  const minutes = parseTimeUnit(iso, 'M');
  return hours * 60 + minutes;
}

/** Helper function to extract time units from ISO duration string */
function parseTimeUnit(iso: string, unit: string): number {
  const index = iso.indexOf(unit);
  if (index === -1) return 0;
  
  // Find the start of the number by going backwards from the unit
  let start = index - 1;
  while (start >= 0 && /\d/.test(iso[start])) {
    start--;
  }
  start++; // Move to the first digit
  
  const numberStr = iso.substring(start, index);
  return numberStr ? Number.parseInt(numberStr, 10) : 0;
}

/**
 * Determines trend direction from a series of numeric values.
 * Uses the first and last values to determine overall direction.
 * A change of less than 1% is considered stable.
 */
export function calculateTrendDirection(values: number[], higherIsBetter = true): TrendDirection {
  if (values.length < 2) return 'stable';

  const first = values[0];
  const last = values[values.length - 1];

  if (first === 0 && last === 0) return 'stable';

  const changePercent = first === 0 ? 100 : ((last - first) / Math.abs(first)) * 100;

  if (Math.abs(changePercent) < 1) return 'stable';

  if (higherIsBetter) {
    return changePercent > 0 ? 'improving' : 'degrading';
  } else {
    // For metrics where lower is better (debt, issues, rating numeric)
    return changePercent < 0 ? 'improving' : 'degrading';
  }
}

/**
 * Calculates the percentage change between first and last values.
 * Returns 0 if there are fewer than 2 data points or first value is 0.
 */
export function calculateChangePercent(values: number[]): number {
  if (values.length < 2 || values[0] === 0) return 0;
  return ((values[values.length - 1] - values[0]) / Math.abs(values[0])) * 100;
}

/**
 * Builds a QualityTrend from a series of QualityMetrics snapshots
 * for a numeric metric extracted via the provided accessor.
 */
export function buildNumericTrend(
  snapshots: QualityMetrics[],
  accessor: (m: QualityMetrics) => number,
  higherIsBetter = true,
): QualityTrend {
  const dataPoints: MetricTrendPoint[] = snapshots.map(m => ({
    timestamp: m.timestamp,
    value: accessor(m),
    label: m.timestamp.toLocaleDateString(),
  }));

  const values = dataPoints.map(p => p.value);

  return {
    direction: calculateTrendDirection(values, higherIsBetter),
    changePercent: calculateChangePercent(values),
    dataPoints,
  };
}

/**
 * Builds a RatingTrend from a series of QualityMetrics snapshots
 * for a rating metric extracted via the provided accessor.
 */
export function buildRatingTrend(
  snapshots: QualityMetrics[],
  accessor: (m: QualityMetrics) => Rating,
): RatingTrend {
  const dataPoints: RatingTrendPoint[] = snapshots.map(m => ({
    timestamp: m.timestamp,
    rating: accessor(m),
    numericValue: ratingToNumeric(accessor(m)),
    label: m.timestamp.toLocaleDateString(),
  }));

  const numericValues = dataPoints.map(p => p.numericValue);
  // For ratings, lower numeric = better (A=1 is best)
  const direction = calculateTrendDirection(numericValues, false);

  return { direction, dataPoints };
}

/**
 * Computes total issue count from a QualityMetrics snapshot.
 */
export function totalIssueCount(m: QualityMetrics): number {
  return (
    m.issues.blocker +
    m.issues.critical +
    m.issues.major +
    m.issues.minor +
    m.issues.info
  );
}

/**
 * Analyzes a series of historical QualityMetrics snapshots and returns
 * trend data for all key metrics.
 *
 * @param snapshots - Array of QualityMetrics ordered from oldest to newest.
 */
export function analyzeHistoricalTrends(snapshots: QualityMetrics[]): HistoricalTrendData {
  return {
    coverage: buildNumericTrend(snapshots, m => m.coverage, true),
    technicalDebt: buildNumericTrend(
      snapshots,
      m => parseTechnicalDebtMinutes(m.technicalDebt),
      false,
    ),
    maintainability: buildRatingTrend(snapshots, m => m.maintainabilityRating),
    reliability: buildRatingTrend(snapshots, m => m.reliabilityRating),
    security: buildRatingTrend(snapshots, m => m.securityRating),
    totalIssues: buildNumericTrend(snapshots, totalIssueCount, false),
  };
}
