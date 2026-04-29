/**
 * Tests for recommendations.ts
 */

import { describe, it, expect } from 'vitest';
import type { CodeIssue } from './types';
import {
  getRecommendationForIssue,
  getRecommendationBySeverity,
  getRecommendationByType,
  generateRecommendations,
  getTopRecommendations,
} from './recommendations';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeIssue(overrides: Partial<CodeIssue> = {}): CodeIssue {
  return {
    id: 'issue-1',
    projectKey: 'test',
    component: 'src/App.tsx',
    line: 10,
    severity: 'MAJOR',
    type: 'CODE_SMELL',
    rule: 'typescript:S3776',
    message: 'Reduce cognitive complexity',
    status: 'OPEN',
    creationDate: new Date('2024-01-01'),
    updateDate: new Date('2024-01-01'),
    ...overrides,
  };
}

// ─── getRecommendationBySeverity ──────────────────────────────────────────────

describe('getRecommendationBySeverity', () => {
  it('returns a recommendation for each severity', () => {
    const severities = ['BLOCKER', 'CRITICAL', 'MAJOR', 'MINOR', 'INFO'] as const;
    for (const s of severities) {
      const rec = getRecommendationBySeverity(s);
      expect(rec.title).toBeTruthy();
      expect(rec.description).toBeTruthy();
      expect(rec.priority).toBeGreaterThan(0);
    }
  });

  it('BLOCKER has higher priority than CRITICAL', () => {
    expect(getRecommendationBySeverity('BLOCKER').priority).toBeLessThan(
      getRecommendationBySeverity('CRITICAL').priority,
    );
  });
});

// ─── getRecommendationByType ──────────────────────────────────────────────────

describe('getRecommendationByType', () => {
  it('returns a recommendation for each type', () => {
    const types = ['BUG', 'VULNERABILITY', 'CODE_SMELL'] as const;
    for (const t of types) {
      const rec = getRecommendationByType(t);
      expect(rec.title).toBeTruthy();
      expect(rec.description).toBeTruthy();
    }
  });

  it('VULNERABILITY has highest priority among types', () => {
    expect(getRecommendationByType('VULNERABILITY').priority).toBeLessThanOrEqual(
      getRecommendationByType('BUG').priority,
    );
  });
});

// ─── getRecommendationForIssue ────────────────────────────────────────────────

describe('getRecommendationForIssue', () => {
  it('returns rule-specific recommendation when rule is known', () => {
    const issue = makeIssue({ rule: 'typescript:S3776' });
    const rec = getRecommendationForIssue(issue);
    expect(rec.title).toContain('cognitive complexity');
  });

  it('falls back to type recommendation for unknown rule', () => {
    const issue = makeIssue({ rule: 'unknown:rule', type: 'BUG' });
    const rec = getRecommendationForIssue(issue);
    expect(rec.title).toContain('bug');
  });

  it('falls back to severity recommendation when rule and type are unknown', () => {
    const issue = makeIssue({ rule: 'unknown:rule', type: 'CODE_SMELL', severity: 'MINOR' });
    const rec = getRecommendationForIssue(issue);
    expect(rec.title).toBeTruthy();
    expect(rec.effort).toBe('low');
  });

  it('returns recommendation with non-empty description', () => {
    const issue = makeIssue({ type: 'VULNERABILITY', severity: 'BLOCKER' });
    const rec = getRecommendationForIssue(issue);
    expect(rec.description.length).toBeGreaterThan(10);
  });
});

// ─── generateRecommendations ──────────────────────────────────────────────────

describe('generateRecommendations', () => {
  it('returns empty array for no issues', () => {
    expect(generateRecommendations([])).toEqual([]);
  });

  it('deduplicates recommendations with the same title', () => {
    const issues = [
      makeIssue({ id: '1', rule: 'typescript:S3776' }),
      makeIssue({ id: '2', rule: 'typescript:S3776' }),
    ];
    const recs = generateRecommendations(issues);
    expect(recs).toHaveLength(1);
  });

  it('sorts by priority ascending', () => {
    const issues = [
      makeIssue({ id: '1', severity: 'INFO', type: 'CODE_SMELL', rule: 'unknown:a' }),
      makeIssue({ id: '2', severity: 'BLOCKER', type: 'BUG', rule: 'unknown:b' }),
    ];
    const recs = generateRecommendations(issues);
    expect(recs[0].priority).toBeLessThanOrEqual(recs[recs.length - 1].priority);
  });
});

// ─── getTopRecommendations ────────────────────────────────────────────────────

describe('getTopRecommendations', () => {
  it('limits results to the specified count', () => {
    const issues = Array.from({ length: 10 }, (_, i) =>
      makeIssue({ id: String(i), rule: `unknown:rule${i}`, severity: 'MAJOR' }),
    );
    const recs = getTopRecommendations(issues, 3);
    expect(recs.length).toBeLessThanOrEqual(3);
  });

  it('defaults to 5 recommendations', () => {
    const issues = Array.from({ length: 20 }, (_, i) =>
      makeIssue({ id: String(i), rule: `unknown:rule${i}`, severity: 'MINOR' }),
    );
    const recs = getTopRecommendations(issues);
    expect(recs.length).toBeLessThanOrEqual(5);
  });
});
