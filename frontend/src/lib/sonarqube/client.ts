/**
 * SonarQube API Client
 *
 * Provides typed access to the SonarQube REST API for:
 *   - Fetching quality metrics for a given project key
 *   - Retrieving quality gate status
 *   - Listing issues by severity
 *
 * Authentication is handled via a SonarQube user token passed as a
 * Bearer token in the Authorization header.
 */

import type {
  SonarQubeClientConfig,
  QualityMetrics,
  QualityGateDetails,
  QualityGateStatus,
  CodeIssue,
  IssueSeverity,
  IssueType,
  IssueStatus,
  IssueResolution,
  IssueSearchParams,
  IssueSearchResult,
  Rating,
  SonarComponentMeasuresResponse,
  SonarQualityGateStatusResponse,
  SonarIssuesResponse,
} from './types';

const DEFAULT_TIMEOUT_MS = 30_000;

// Metric keys requested from the SonarQube measures API
const QUALITY_METRIC_KEYS = [
  'sqale_rating',           // maintainability rating
  'reliability_rating',     // reliability rating
  'security_rating',        // security rating
  'coverage',               // line coverage %
  'duplicated_lines_density',
  'ncloc',                  // lines of code
  'sqale_index',            // technical debt (minutes)
  'blocker_violations',
  'critical_violations',
  'major_violations',
  'minor_violations',
  'info_violations',
  'alert_status',           // quality gate status
].join(',');

export class SonarQubeError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly endpoint: string,
  ) {
    super(message);
    this.name = 'SonarQubeError';
  }
}

/**
 * Minimal fetch wrapper used by the client.
 * Kept separate from the app's api.ts so this module can also be used
 * in Node.js scripts (orchestrator, webhook handler).
 */
async function sonarFetch<T>(
  baseUrl: string,
  token: string,
  path: string,
  params: Record<string, string>,
  timeoutMs: number,
): Promise<T> {
  const url = new URL(`${baseUrl.replace(/\/$/, '')}/api/${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new SonarQubeError(
        `SonarQube API error: ${response.status} ${response.statusText}`,
        response.status,
        path,
      );
    }

    return (await response.json()) as T;
  } catch (err) {
    if (err instanceof SonarQubeError) throw err;
    if (err instanceof Error && err.name === 'AbortError') {
      throw new SonarQubeError(`Request timed out after ${timeoutMs}ms`, 0, path);
    }
    throw new SonarQubeError(
      err instanceof Error ? err.message : 'Network error',
      0,
      path,
    );
  } finally {
    clearTimeout(timer);
  }
}

// ─── Mapping helpers ──────────────────────────────────────────────────────────

function measureValue(measures: { metric: string; value?: string }[], key: string): string {
  return measures.find(m => m.metric === key)?.value ?? '0';
}

function toRating(value: string): Rating {
  const map: Record<string, Rating> = { '1': 'A', '2': 'B', '3': 'C', '4': 'D', '5': 'E' };
  return map[value] ?? 'E';
}

function minutesToIso8601(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `PT${m}M`;
  if (m === 0) return `PT${h}H`;
  return `PT${h}H${m}M`;
}

function mapQualityGateStatus(raw: string): 'PASSED' | 'FAILED' | 'NONE' {
  if (raw === 'OK') return 'PASSED';
  if (raw === 'ERROR' || raw === 'WARN') return 'FAILED';
  return 'NONE';
}

// ─── SonarQube API Client ─────────────────────────────────────────────────────

export class SonarQubeClient {
  private readonly baseUrl: string;
  private readonly token: string;
  private readonly timeoutMs: number;

  constructor(config: SonarQubeClientConfig) {
    this.baseUrl = config.baseUrl;
    this.token = config.token;
    this.timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  /**
   * Fetches quality metrics for a given project key.
   * Maps raw SonarQube measure values to the typed QualityMetrics model.
   */
  async getQualityMetrics(projectKey: string): Promise<QualityMetrics> {
    const data = await sonarFetch<SonarComponentMeasuresResponse>(
      this.baseUrl,
      this.token,
      'measures/component',
      { component: projectKey, metricKeys: QUALITY_METRIC_KEYS },
      this.timeoutMs,
    );

    const m = data.component.measures;

    return {
      projectKey,
      timestamp: new Date(),
      maintainabilityRating: toRating(measureValue(m, 'sqale_rating')),
      reliabilityRating: toRating(measureValue(m, 'reliability_rating')),
      securityRating: toRating(measureValue(m, 'security_rating')),
      overallRating: toRating(measureValue(m, 'sqale_rating')), // use maintainability as overall
      coverage: Number.parseFloat(measureValue(m, 'coverage')),
      duplicatedLinesDensity: Number.parseFloat(measureValue(m, 'duplicated_lines_density')),
      linesOfCode: Number.parseInt(measureValue(m, 'ncloc'), 10),
      technicalDebt: minutesToIso8601(Number.parseInt(measureValue(m, 'sqale_index'), 10)),
      issues: {
        blocker: Number.parseInt(measureValue(m, 'blocker_violations'), 10),
        critical: Number.parseInt(measureValue(m, 'critical_violations'), 10),
        major: Number.parseInt(measureValue(m, 'major_violations'), 10),
        minor: Number.parseInt(measureValue(m, 'minor_violations'), 10),
        info: Number.parseInt(measureValue(m, 'info_violations'), 10),
      },
      qualityGateStatus: mapQualityGateStatus(measureValue(m, 'alert_status')),
    };
  }

  /**
   * Retrieves the quality gate status and individual condition results
   * for a given project key.
   */
  async getQualityGateStatus(projectKey: string): Promise<QualityGateDetails> {
    const data = await sonarFetch<SonarQualityGateStatusResponse>(
      this.baseUrl,
      this.token,
      'qualitygates/project_status',
      { projectKey },
      this.timeoutMs,
    );

    const { status, conditions } = data.projectStatus;

    return {
      projectKey,
      status: status as QualityGateStatus,
      conditions: conditions.map(c => ({
        status: c.status as 'OK' | 'WARN' | 'ERROR',
        metricKey: c.metricKey,
        comparator: c.comparator as 'LT' | 'GT' | 'EQ' | 'NE',
        errorThreshold: c.errorThreshold,
        actualValue: c.actualValue,
      })),
    };
  }

  /**
   * Lists issues for a project, optionally filtered by severity.
   * Supports pagination via page / pageSize parameters.
   */
  async getIssues(params: IssueSearchParams): Promise<IssueSearchResult> {
    const queryParams: Record<string, string> = {
      componentKeys: params.projectKey,
      p: String(params.page ?? 1),
      ps: String(Math.min(params.pageSize ?? 100, 500)),
    };

    if (params.severities?.length) {
      queryParams.severities = params.severities.join(',');
    }
    if (params.types?.length) {
      queryParams.types = params.types.join(',');
    }
    if (params.statuses?.length) {
      queryParams.statuses = params.statuses.join(',');
    }

    const data = await sonarFetch<SonarIssuesResponse>(
      this.baseUrl,
      this.token,
      'issues/search',
      queryParams,
      this.timeoutMs,
    );

    return {
      issues: data.issues.map(i => ({
        id: i.key,
        projectKey: i.project,
        component: i.component,
        line: i.line ?? 0,
        severity: i.severity as IssueSeverity,
        type: i.type as IssueType,
        rule: i.rule,
        message: i.message,
        status: i.status as IssueStatus,
        resolution: i.resolution as IssueResolution | undefined,
        assignee: i.assignee,
        creationDate: new Date(i.creationDate),
        updateDate: new Date(i.updateDate),
        effort: i.effort,
      })),
      total: data.total,
      page: data.p,
      pageSize: data.ps,
    };
  }

  /**
   * Convenience method: fetch all issues of a specific severity for a project.
   */
  async getIssuesBySeverity(
    projectKey: string,
    severity: IssueSeverity,
  ): Promise<CodeIssue[]> {
    const result = await this.getIssues({ projectKey, severities: [severity], pageSize: 500 });
    return result.issues;
  }
}

/**
 * Factory function — creates a SonarQubeClient from environment variables.
 * Expects VITE_SONAR_URL and VITE_SONAR_TOKEN (browser) or
 * SONAR_HOST_URL and SONAR_TOKEN (Node.js / CI).
 */
export function createSonarQubeClient(overrides?: Partial<SonarQubeClientConfig>): SonarQubeClient {
  // Support both browser (Vite) and Node.js environments
  const env = typeof process !== 'undefined' ? process.env : {};
  const importMetaEnv =
    typeof import.meta !== 'undefined' && 'env' in import.meta
      ? (import.meta as { env: Record<string, string> }).env
      : {};

  const baseUrl =
    overrides?.baseUrl ??
    importMetaEnv['VITE_SONAR_URL'] ??
    env['SONAR_HOST_URL'] ??
    'http://localhost:9000';

  const token =
    overrides?.token ??
    importMetaEnv['VITE_SONAR_TOKEN'] ??
    env['SONAR_TOKEN'] ??
    '';

  return new SonarQubeClient({ baseUrl, token, ...overrides });
}
