/**
 * SonarQube module public API
 */
export { SonarQubeClient, SonarQubeError, createSonarQubeClient } from './client';
export type {
  SonarQubeClientConfig,
  QualityMetrics,
  QualityGateDetails,
  QualityGateStatus,
  QualityGateCondition,
  CodeIssue,
  IssueSeverity,
  IssueType,
  IssueStatus,
  IssueResolution,
  IssueSearchParams,
  IssueSearchResult,
  Rating,
} from './types';

export {
  analyzeHistoricalTrends,
  buildNumericTrend,
  buildRatingTrend,
  calculateTrendDirection,
  calculateChangePercent,
  ratingToNumeric,
  parseTechnicalDebtMinutes,
  totalIssueCount,
} from './qualityTrends';
export type {
  TrendDirection,
  MetricTrendPoint,
  RatingTrendPoint,
  QualityTrend,
  RatingTrend,
  HistoricalTrendData,
} from './qualityTrends';

export {
  getRecommendationForIssue,
  getRecommendationBySeverity,
  getRecommendationByType,
  generateRecommendations,
  getTopRecommendations,
} from './recommendations';
export type { Recommendation } from './recommendations';

export {
  categorizeIssues,
  prioritizeSecurityIssues,
  getCodeSmellFix,
  IssueResolutionQueue,
  createResolutionQueue,
} from './issueResolution';
export type {
  CategorizedIssues,
  CodeSmellFix,
  ResolutionResult,
} from './issueResolution';
