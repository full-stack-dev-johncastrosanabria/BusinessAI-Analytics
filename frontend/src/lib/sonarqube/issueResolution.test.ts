/**
 * Unit tests for the Issue Resolution Engine
 * Covers: categorizeIssues, prioritizeSecurityIssues, getCodeSmellFix,
 *         IssueResolutionQueue, createResolutionQueue
 */

import { describe, it, expect } from 'vitest';
import {
  categorizeIssues,
  prioritizeSecurityIssues,
  getCodeSmellFix,
  IssueResolutionQueue,
  createResolutionQueue,
} from './issueResolution';
import type { CodeIssue } from './types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeIssue(overrides: Partial<CodeIssue> & { id: string }): CodeIssue {
  return {
    projectKey: 'test-project',
    component: 'src/Foo.ts',
    line: 1,
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

// ─── categorizeIssues ─────────────────────────────────────────────────────────

describe('categorizeIssues', () => {
  it('returns empty buckets for an empty list', () => {
    const result = categorizeIssues([]);
    expect(result.BLOCKER).toHaveLength(0);
    expect(result.CRITICAL).toHaveLength(0);
    expect(result.MAJOR).toHaveLength(0);
    expect(result.MINOR).toHaveLength(0);
    expect(result.INFO).toHaveLength(0);
  });

  it('places each issue in the correct severity bucket', () => {
    const issues: CodeIssue[] = [
      makeIssue({ id: '1', severity: 'BLOCKER' }),
      makeIssue({ id: '2', severity: 'CRITICAL' }),
      makeIssue({ id: '3', severity: 'MAJOR' }),
      makeIssue({ id: '4', severity: 'MINOR' }),
      makeIssue({ id: '5', severity: 'INFO' }),
    ];

    const result = categorizeIssues(issues);

    expect(result.BLOCKER.map((i) => i.id)).toEqual(['1']);
    expect(result.CRITICAL.map((i) => i.id)).toEqual(['2']);
    expect(result.MAJOR.map((i) => i.id)).toEqual(['3']);
    expect(result.MINOR.map((i) => i.id)).toEqual(['4']);
    expect(result.INFO.map((i) => i.id)).toEqual(['5']);
  });

  it('groups multiple issues of the same severity together', () => {
    const issues: CodeIssue[] = [
      makeIssue({ id: 'a', severity: 'MAJOR' }),
      makeIssue({ id: 'b', severity: 'MAJOR' }),
      makeIssue({ id: 'c', severity: 'MINOR' }),
    ];

    const result = categorizeIssues(issues);

    expect(result.MAJOR).toHaveLength(2);
    expect(result.MINOR).toHaveLength(1);
    expect(result.BLOCKER).toHaveLength(0);
  });

  it('does not mutate the original array', () => {
    const issues = [makeIssue({ id: '1', severity: 'BLOCKER' })];
    const copy = [...issues];
    categorizeIssues(issues);
    expect(issues).toEqual(copy);
  });
});

// ─── prioritizeSecurityIssues ─────────────────────────────────────────────────

describe('prioritizeSecurityIssues', () => {
  it('returns an empty array for empty input', () => {
    expect(prioritizeSecurityIssues([])).toEqual([]);
  });

  it('places VULNERABILITY issues before non-vulnerability issues', () => {
    const issues: CodeIssue[] = [
      makeIssue({ id: 'smell', type: 'CODE_SMELL', severity: 'BLOCKER' }),
      makeIssue({ id: 'vuln', type: 'VULNERABILITY', severity: 'MAJOR' }),
    ];

    const result = prioritizeSecurityIssues(issues);

    expect(result[0].id).toBe('vuln');
    expect(result[1].id).toBe('smell');
  });

  it('sorts vulnerabilities by severity among themselves', () => {
    const issues: CodeIssue[] = [
      makeIssue({ id: 'v-minor', type: 'VULNERABILITY', severity: 'MINOR' }),
      makeIssue({ id: 'v-blocker', type: 'VULNERABILITY', severity: 'BLOCKER' }),
      makeIssue({ id: 'v-critical', type: 'VULNERABILITY', severity: 'CRITICAL' }),
    ];

    const result = prioritizeSecurityIssues(issues);
    const ids = result.map((i) => i.id);

    expect(ids).toEqual(['v-blocker', 'v-critical', 'v-minor']);
  });

  it('sorts non-vulnerability issues by severity after all vulnerabilities', () => {
    const issues: CodeIssue[] = [
      makeIssue({ id: 'bug-minor', type: 'BUG', severity: 'MINOR' }),
      makeIssue({ id: 'vuln-major', type: 'VULNERABILITY', severity: 'MAJOR' }),
      makeIssue({ id: 'bug-blocker', type: 'BUG', severity: 'BLOCKER' }),
    ];

    const result = prioritizeSecurityIssues(issues);
    const ids = result.map((i) => i.id);

    expect(ids).toEqual(['vuln-major', 'bug-blocker', 'bug-minor']);
  });

  it('does not mutate the original array', () => {
    const issues = [
      makeIssue({ id: '1', type: 'BUG' }),
      makeIssue({ id: '2', type: 'VULNERABILITY' }),
    ];
    const originalFirst = issues[0].id;
    prioritizeSecurityIssues(issues);
    expect(issues[0].id).toBe(originalFirst);
  });
});

// ─── getCodeSmellFix ──────────────────────────────────────────────────────────

describe('getCodeSmellFix', () => {
  it('returns duplicated code fix for duplication-related rules', () => {
    const issue = makeIssue({ id: '1', rule: 'typescript:S1192', message: 'String literal duplicated' });
    const fix = getCodeSmellFix(issue);
    expect(fix.description.toLowerCase()).toContain('duplicat');
    expect(fix.preservesFunctionality).toBe(true);
    expect(fix.steps.length).toBeGreaterThan(0);
  });

  it('returns duplicated code fix when message contains "duplicat"', () => {
    const issue = makeIssue({ id: '1', rule: 'custom:rule', message: 'Duplicated block of code' });
    const fix = getCodeSmellFix(issue);
    expect(fix.description.toLowerCase()).toContain('duplicat');
  });

  it('returns complex method fix for cognitive complexity rule', () => {
    const issue = makeIssue({ id: '1', rule: 'typescript:S3776', message: 'Cognitive Complexity of this function is 20' });
    const fix = getCodeSmellFix(issue);
    expect(fix.description.toLowerCase()).toContain('complex');
    expect(fix.preservesFunctionality).toBe(true);
  });

  it('returns complex method fix when message contains "cognitive complexity"', () => {
    const issue = makeIssue({ id: '1', rule: 'custom:rule', message: 'Cognitive complexity is too high' });
    const fix = getCodeSmellFix(issue);
    expect(fix.description.toLowerCase()).toContain('complex');
  });

  it('returns naming fix for naming convention rules', () => {
    const issue = makeIssue({ id: '1', rule: 'java:S100', message: 'Rename this method' });
    const fix = getCodeSmellFix(issue);
    expect(fix.description.toLowerCase()).toContain('naming');
    expect(fix.preservesFunctionality).toBe(true);
  });

  it('returns naming fix when message contains "naming convention"', () => {
    const issue = makeIssue({ id: '1', rule: 'custom:rule', message: 'Naming convention violation' });
    const fix = getCodeSmellFix(issue);
    expect(fix.description.toLowerCase()).toContain('naming');
  });

  it('returns a generic fallback fix for unrecognized code smells', () => {
    const issue = makeIssue({ id: '1', rule: 'custom:unknown', message: 'Some other smell' });
    const fix = getCodeSmellFix(issue);
    expect(fix.preservesFunctionality).toBe(true);
    expect(fix.steps.length).toBeGreaterThan(0);
  });

  it('all fixes have preservesFunctionality set to true', () => {
    const testCases = [
      makeIssue({ id: '1', rule: 'typescript:S1192', message: 'duplicated' }),
      makeIssue({ id: '2', rule: 'typescript:S3776', message: 'cognitive complexity' }),
      makeIssue({ id: '3', rule: 'java:S100', message: 'naming convention' }),
      makeIssue({ id: '4', rule: 'unknown:rule', message: 'something else' }),
    ];

    for (const issue of testCases) {
      expect(getCodeSmellFix(issue).preservesFunctionality).toBe(true);
    }
  });
});

// ─── IssueResolutionQueue ─────────────────────────────────────────────────────

describe('IssueResolutionQueue', () => {
  it('starts empty when constructed with no issues', () => {
    const queue = new IssueResolutionQueue([]);
    expect(queue.isEmpty).toBe(true);
    expect(queue.size).toBe(0);
    expect(queue.peek()).toBeUndefined();
    expect(queue.dequeue()).toBeUndefined();
  });

  it('orders issues BLOCKER → CRITICAL → MAJOR → MINOR → INFO', () => {
    const issues: CodeIssue[] = [
      makeIssue({ id: 'info', severity: 'INFO' }),
      makeIssue({ id: 'major', severity: 'MAJOR' }),
      makeIssue({ id: 'blocker', severity: 'BLOCKER' }),
      makeIssue({ id: 'minor', severity: 'MINOR' }),
      makeIssue({ id: 'critical', severity: 'CRITICAL' }),
    ];

    const queue = new IssueResolutionQueue(issues);
    const ids = queue.toArray().map((i) => i.id);

    expect(ids[0]).toBe('blocker');
    expect(ids[1]).toBe('critical');
    expect(ids[2]).toBe('major');
    expect(ids[3]).toBe('minor');
    expect(ids[4]).toBe('info');
  });

  it('places VULNERABILITY before other types at the same severity', () => {
    const issues: CodeIssue[] = [
      makeIssue({ id: 'smell', type: 'CODE_SMELL', severity: 'CRITICAL' }),
      makeIssue({ id: 'vuln', type: 'VULNERABILITY', severity: 'CRITICAL' }),
    ];

    const queue = new IssueResolutionQueue(issues);
    expect(queue.peek()?.id).toBe('vuln');
  });

  it('dequeue removes and returns the highest-priority issue', () => {
    const issues: CodeIssue[] = [
      makeIssue({ id: 'minor', severity: 'MINOR' }),
      makeIssue({ id: 'blocker', severity: 'BLOCKER' }),
    ];

    const queue = new IssueResolutionQueue(issues);
    const first = queue.dequeue();

    expect(first?.id).toBe('blocker');
    expect(queue.size).toBe(1);
  });

  it('toArray returns a copy and does not affect the queue', () => {
    const issues = [makeIssue({ id: '1', severity: 'MAJOR' })];
    const queue = new IssueResolutionQueue(issues);
    const arr = queue.toArray();
    arr.pop();
    expect(queue.size).toBe(1);
  });
});

// ─── createResolutionQueue ────────────────────────────────────────────────────

describe('createResolutionQueue', () => {
  it('returns an IssueResolutionQueue instance', () => {
    const queue = createResolutionQueue([]);
    expect(queue).toBeInstanceOf(IssueResolutionQueue);
  });

  it('creates a queue with correct priority ordering', () => {
    const issues: CodeIssue[] = [
      makeIssue({ id: 'info', severity: 'INFO' }),
      makeIssue({ id: 'blocker', severity: 'BLOCKER' }),
    ];

    const queue = createResolutionQueue(issues);
    expect(queue.peek()?.id).toBe('blocker');
  });
});
