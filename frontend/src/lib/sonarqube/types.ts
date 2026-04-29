/**
 * SonarQube API Types
 *
 * Data models for interacting with the SonarQube REST API.
 * Aligned with the QualityMetrics and CodeIssue models from the design document.
 */

export type Rating = 'A' | 'B' | 'C' | 'D' | 'E';
export type QualityGateStatus = 'OK' | 'WARN' | 'ERROR' | 'NONE';
export type IssueSeverity = 'BLOCKER' | 'CRITICAL' | 'MAJOR' | 'MINOR' | 'INFO';
export type IssueType = 'BUG' | 'VULNERABILITY' | 'CODE_SMELL';
export type IssueStatus = 'OPEN' | 'CONFIRMED' | 'REOPENED' | 'RESOLVED' | 'CLOSED';
export type IssueResolution = 'FIXED' | 'FALSE_POSITIVE' | 'WONT_FIX' | 'REMOVED';

export interface QualityMetrics {
  projectKey: string;
  timestamp: Date;
  overallRating: Rating;
  maintainabilityRating: Rating;
  reliabilityRating: Rating;
  securityRating: Rating;
  coverage: number;
  duplicatedLinesDensity: number;
  linesOfCode: number;
  technicalDebt: string; // ISO 8601 duration e.g. "PT2H30M"
  issues: {
    blocker: number;
    critical: number;
    major: number;
    minor: number;
    info: number;
  };
  qualityGateStatus: 'PASSED' | 'FAILED' | 'NONE';
}

export interface CodeIssue {
  id: string;
  projectKey: string;
  component: string;
  line: number;
  severity: IssueSeverity;
  type: IssueType;
  rule: string;
  message: string;
  status: IssueStatus;
  resolution?: IssueResolution;
  assignee?: string;
  creationDate: Date;
  updateDate: Date;
  effort?: string; // ISO 8601 duration
}

export interface QualityGateCondition {
  status: 'OK' | 'WARN' | 'ERROR';
  metricKey: string;
  comparator: 'LT' | 'GT' | 'EQ' | 'NE';
  errorThreshold: string;
  actualValue: string;
}

export interface QualityGateDetails {
  projectKey: string;
  status: QualityGateStatus;
  conditions: QualityGateCondition[];
}

export interface SonarQubeClientConfig {
  baseUrl: string;
  token: string;
  /** Request timeout in milliseconds (default: 30000) */
  timeoutMs?: number;
}

export interface IssueSearchParams {
  projectKey: string;
  severities?: IssueSeverity[];
  types?: IssueType[];
  statuses?: IssueStatus[];
  /** Page number (1-based) */
  page?: number;
  /** Results per page (max 500) */
  pageSize?: number;
}

export interface IssueSearchResult {
  issues: CodeIssue[];
  total: number;
  page: number;
  pageSize: number;
}

/** Raw SonarQube API measure component shape */
interface SonarMeasure {
  metric: string;
  value?: string;
}

interface SonarComponent {
  key: string;
  measures: SonarMeasure[];
}

export interface SonarComponentMeasuresResponse {
  component: SonarComponent;
}

/** Raw SonarQube API quality gate status shape */
interface SonarQGCondition {
  status: string;
  metricKey: string;
  comparator: string;
  errorThreshold: string;
  actualValue: string;
}

export interface SonarQualityGateStatusResponse {
  projectStatus: {
    status: string;
    conditions: SonarQGCondition[];
  };
}

/** Raw SonarQube API issue shape */
interface SonarIssue {
  key: string;
  project: string;
  component: string;
  line?: number;
  severity: string;
  type: string;
  rule: string;
  message: string;
  status: string;
  resolution?: string;
  assignee?: string;
  creationDate: string;
  updateDate: string;
  effort?: string;
}

export interface SonarIssuesResponse {
  issues: SonarIssue[];
  total: number;
  p: number;
  ps: number;
}
