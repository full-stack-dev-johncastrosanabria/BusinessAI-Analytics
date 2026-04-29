/**
 * Unit tests for the SonarQube API client
 *
 * Tests cover:
 *   - Quality metrics fetching and mapping
 *   - Quality gate status retrieval
 *   - Issue listing and filtering by severity
 *   - Authentication header construction
 *   - Error handling (HTTP errors, timeouts)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SonarQubeClient, SonarQubeError, createSonarQubeClient } from './client';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const BASE_URL = 'http://sonar.example.com';
const TOKEN = 'test-token-abc123';
const PROJECT_KEY = 'my-project';

const mockMeasuresResponse = {
  component: {
    key: PROJECT_KEY,
    measures: [
      { metric: 'sqale_rating', value: '1' },          // A
      { metric: 'reliability_rating', value: '2' },    // B
      { metric: 'security_rating', value: '1' },       // A
      { metric: 'coverage', value: '85.5' },
      { metric: 'duplicated_lines_density', value: '1.2' },
      { metric: 'ncloc', value: '12345' },
      { metric: 'sqale_index', value: '90' },          // 90 minutes → PT1H30M
      { metric: 'blocker_violations', value: '0' },
      { metric: 'critical_violations', value: '2' },
      { metric: 'major_violations', value: '10' },
      { metric: 'minor_violations', value: '5' },
      { metric: 'info_violations', value: '1' },
      { metric: 'alert_status', value: 'OK' },
    ],
  },
};

const mockQualityGateResponse = {
  projectStatus: {
    status: 'ERROR',
    conditions: [
      {
        status: 'ERROR',
        metricKey: 'new_coverage',
        comparator: 'LT',
        errorThreshold: '80',
        actualValue: '72.5',
      },
      {
        status: 'OK',
        metricKey: 'new_blocker_violations',
        comparator: 'GT',
        errorThreshold: '0',
        actualValue: '0',
      },
    ],
  },
};

const mockIssuesResponse = {
  issues: [
    {
      key: 'issue-1',
      project: PROJECT_KEY,
      component: `${PROJECT_KEY}:src/Foo.java`,
      line: 42,
      severity: 'CRITICAL',
      type: 'BUG',
      rule: 'java:S1234',
      message: 'Fix this bug',
      status: 'OPEN',
      resolution: undefined,
      assignee: undefined,
      creationDate: '2024-01-15T10:00:00+0000',
      updateDate: '2024-01-16T08:00:00+0000',
      effort: 'PT30M',
    },
  ],
  total: 1,
  p: 1,
  ps: 100,
};

// ─── Fetch mock helpers ───────────────────────────────────────────────────────

function mockFetchOnce(body: unknown, status = 200): void {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValueOnce({
      ok: status >= 200 && status < 300,
      status,
      statusText: status === 200 ? 'OK' : 'Error',
      json: async () => body,
    }),
  );
}

function mockFetchError(message: string): void {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValueOnce(new Error(message)));
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('SonarQubeClient', () => {
  let client: SonarQubeClient;

  beforeEach(() => {
    client = new SonarQubeClient({ baseUrl: BASE_URL, token: TOKEN });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── getQualityMetrics ──────────────────────────────────────────────────────

  describe('getQualityMetrics', () => {
    it('maps measure values to typed QualityMetrics', async () => {
      mockFetchOnce(mockMeasuresResponse);

      const metrics = await client.getQualityMetrics(PROJECT_KEY);

      expect(metrics.projectKey).toBe(PROJECT_KEY);
      expect(metrics.maintainabilityRating).toBe('A');
      expect(metrics.reliabilityRating).toBe('B');
      expect(metrics.securityRating).toBe('A');
      expect(metrics.coverage).toBeCloseTo(85.5);
      expect(metrics.duplicatedLinesDensity).toBeCloseTo(1.2);
      expect(metrics.linesOfCode).toBe(12345);
      expect(metrics.technicalDebt).toBe('PT1H30M');
      expect(metrics.issues.blocker).toBe(0);
      expect(metrics.issues.critical).toBe(2);
      expect(metrics.issues.major).toBe(10);
      expect(metrics.issues.minor).toBe(5);
      expect(metrics.issues.info).toBe(1);
      expect(metrics.qualityGateStatus).toBe('PASSED');
      expect(metrics.timestamp).toBeInstanceOf(Date);
    });

    it('maps alert_status ERROR to FAILED', async () => {
      const response = {
        component: {
          key: PROJECT_KEY,
          measures: [
            ...mockMeasuresResponse.component.measures.filter(m => m.metric !== 'alert_status'),
            { metric: 'alert_status', value: 'ERROR' },
          ],
        },
      };
      mockFetchOnce(response);

      const metrics = await client.getQualityMetrics(PROJECT_KEY);
      expect(metrics.qualityGateStatus).toBe('FAILED');
    });

    it('sends Authorization Bearer header', async () => {
      const fetchSpy = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockMeasuresResponse,
      });
      vi.stubGlobal('fetch', fetchSpy);

      await client.getQualityMetrics(PROJECT_KEY);

      const [, options] = fetchSpy.mock.calls[0] as [string, RequestInit];
      expect((options.headers as Record<string, string>)['Authorization']).toBe(`Bearer ${TOKEN}`);
    });

    it('throws SonarQubeError on HTTP 401', async () => {
      mockFetchOnce({ errors: [{ msg: 'Unauthorized' }] }, 401);

      await expect(client.getQualityMetrics(PROJECT_KEY)).rejects.toThrow(SonarQubeError);
    });

    it('throws SonarQubeError on network failure', async () => {
      mockFetchError('Network unreachable');

      await expect(client.getQualityMetrics(PROJECT_KEY)).rejects.toThrow(SonarQubeError);
    });
  });

  // ── getQualityGateStatus ───────────────────────────────────────────────────

  describe('getQualityGateStatus', () => {
    it('returns gate status and conditions', async () => {
      mockFetchOnce(mockQualityGateResponse);

      const gate = await client.getQualityGateStatus(PROJECT_KEY);

      expect(gate.projectKey).toBe(PROJECT_KEY);
      expect(gate.status).toBe('ERROR');
      expect(gate.conditions).toHaveLength(2);
      expect(gate.conditions[0].metricKey).toBe('new_coverage');
      expect(gate.conditions[0].status).toBe('ERROR');
      expect(gate.conditions[0].actualValue).toBe('72.5');
    });

    it('throws SonarQubeError on HTTP 404', async () => {
      mockFetchOnce({ errors: [{ msg: 'Not found' }] }, 404);

      await expect(client.getQualityGateStatus(PROJECT_KEY)).rejects.toThrow(SonarQubeError);
    });
  });

  // ── getIssues ──────────────────────────────────────────────────────────────

  describe('getIssues', () => {
    it('returns mapped issues with correct types', async () => {
      mockFetchOnce(mockIssuesResponse);

      const result = await client.getIssues({ projectKey: PROJECT_KEY });

      expect(result.total).toBe(1);
      expect(result.issues).toHaveLength(1);

      const issue = result.issues[0];
      expect(issue.id).toBe('issue-1');
      expect(issue.severity).toBe('CRITICAL');
      expect(issue.type).toBe('BUG');
      expect(issue.line).toBe(42);
      expect(issue.creationDate).toBeInstanceOf(Date);
      expect(issue.updateDate).toBeInstanceOf(Date);
    });

    it('passes severity filter in query params', async () => {
      const fetchSpy = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ issues: [], total: 0, p: 1, ps: 100 }),
      });
      vi.stubGlobal('fetch', fetchSpy);

      await client.getIssues({ projectKey: PROJECT_KEY, severities: ['BLOCKER', 'CRITICAL'] });

      const [url] = fetchSpy.mock.calls[0] as [string];
      expect(url).toContain('severities=BLOCKER%2CCRITICAL');
    });

    it('caps pageSize at 500', async () => {
      const fetchSpy = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ issues: [], total: 0, p: 1, ps: 500 }),
      });
      vi.stubGlobal('fetch', fetchSpy);

      await client.getIssues({ projectKey: PROJECT_KEY, pageSize: 9999 });

      const [url] = fetchSpy.mock.calls[0] as [string];
      expect(url).toContain('ps=500');
    });
  });

  // ── getIssuesBySeverity ────────────────────────────────────────────────────

  describe('getIssuesBySeverity', () => {
    it('returns issues filtered by the given severity', async () => {
      mockFetchOnce(mockIssuesResponse);

      const issues = await client.getIssuesBySeverity(PROJECT_KEY, 'CRITICAL');

      expect(issues).toHaveLength(1);
      expect(issues[0].severity).toBe('CRITICAL');
    });
  });
});

// ─── createSonarQubeClient ────────────────────────────────────────────────────

describe('createSonarQubeClient', () => {
  it('creates a client with explicit overrides', () => {
    const client = createSonarQubeClient({ baseUrl: BASE_URL, token: TOKEN });
    expect(client).toBeInstanceOf(SonarQubeClient);
  });
});
