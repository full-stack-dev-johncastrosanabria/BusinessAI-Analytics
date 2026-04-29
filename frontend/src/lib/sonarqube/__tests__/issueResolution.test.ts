/**
 * Unit tests for issueResolution.ts
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
} from '../issueResolution';
import type { CodeIssue, IssueSeverity, IssueType } from '../types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

let _idCounter = 0;
function makeIssue(
  severity: IssueSeverity,
  type: IssueType = 'CODE_SMELL',
  overrides: Partial<CodeIssue> = {},
): CodeIssue {
  return {
    id: `issue-${++_idCounter}`,
    projectKey: 'test',
    component: 'src/Foo.ts',
    line: 1,
    severity,
    type,
    rule: 'S1234',
    message: 'Some issue',
    status: 'OPEN',
    creationDate: new Date('2024-01-01'),
    updateDate: new Date('2024-01-01'),
    ...overrides,
  };
}

// ─── categorizeIssues ─────────────────────────────────────────────────────────

describe('categorizeIssues', () => {
  it('returns empty buckets for empty input', () => {
    const result = categorizeIssues([]);
    expect(result.BLOCKER).toHaveLength(0);
    expect(result.CRITICAL).toHaveLength(0);
    expect(result.MAJOR).toHaveLength(0);
    expect(result.MINOR).toHaveLength(0);
    expect(result.INFO).toHaveLength(0);
  });

  it('places each issue in the correct severity bucket', () => {
    const issues = [
      makeIssue('BLOCKER'),
      makeIssue('CRITICAL'),
      makeIssue('MAJOR'),
      makeIssue('MINOR'),
      makeIssue('INFO'),
    ];
    const result = categorizeIssues(issues);
    expect(result.BLOCKER).toHaveLength(1);
    expect(result.CRITICAL).toHaveLength(1);
    expect(result.MAJOR).toHaveLength(1);
    expect(result.MINOR).toHaveLength(1);
    expect(result.INFO).toHaveLength(1);
  });

  it('groups multiple issues of the same severity together', () => {
    const issues = [makeIssue('MAJOR'), makeIssue('MAJOR'), makeIssue('MINOR')];
    const result = categorizeIssues(issues);
    expect(result.MAJOR).toHaveLength(2);
    expect(result.MINOR).toHaveLength(1);
  });

  it('does not mutate the input array', () => {
    const issues = [makeIssue('BLOCKER')];
    const copy = [...issues];
    categorizeIssues(issues);
    expect(issues).toEqual(copy);
  });
});

// ─── prioritizeSecurityIssues ─────────────────────────────────────────────────

describe('prioritizeSecurityIssues', () => {
  it('returns empty array for empty input', () => {
    expect(prioritizeSecurityIssues([])).toEqual([]);
  });

  it('places VULNERABILITY issues before non-vulnerability issues', () => {
    const issues = [
      makeIssue('MINOR', 'CODE_SMELL'),
      makeIssue('CRITICAL', 'VULNERABILITY'),
      makeIssue('MAJOR', 'BUG'),
    ];
    const result = prioritizeSecurityIssues(issues);
    expect(result[0].type).toBe('VULNERABILITY');
  });

  it('sorts by severity within the same type group', () => {
    const issues = [
      makeIssue('MINOR', 'VULNERABILITY'),
      makeIssue('BLOCKER', 'VULNERABILITY'),
      makeIssue('CRITICAL', 'VULNERABILITY'),
    ];
    const result = prioritizeSecurityIssues(issues);
    expect(result[0].severity).toBe('BLOCKER');
    expect(result[1].severity).toBe('CRITICAL');
    expect(result[2].severity).toBe('MINOR');
  });

  it('does not mutate the original array', () => {
    const issues = [makeIssue('MAJOR', 'BUG'), makeIssue('BLOCKER', 'VULNERABILITY')];
    const original = [...issues];
    prioritizeSecurityIssues(issues);
    expect(issues[0].id).toBe(original[0].id);
  });

  it('keeps all issues in the result', () => {
    const issues = [
      makeIssue('INFO', 'CODE_SMELL'),
      makeIssue('BLOCKER', 'VULNERABILITY'),
      makeIssue('MAJOR', 'BUG'),
    ];
    expect(prioritizeSecurityIssues(issues)).toHaveLength(3);
  });
});

// ─── getCodeSmellFix ──────────────────────────────────────────────────────────

describe('getCodeSmellFix', () => {
  it('returns duplicated-code fix for message containing "duplicat"', () => {
    const issue = makeIssue('MAJOR', 'CODE_SMELL', { message: 'Duplicated code block' });
    const fix = getCodeSmellFix(issue);
    expect(fix.description).toMatch(/duplicat/i);
    expect(fix.preservesFunctionality).toBe(true);
  });

  it('returns duplicated-code fix for rule S1192', () => {
    const issue = makeIssue('MAJOR', 'CODE_SMELL', { rule: 'S1192', message: 'String literal' });
    const fix = getCodeSmellFix(issue);
    expect(fix.steps.length).toBeGreaterThan(0);
    expect(fix.preservesFunctionality).toBe(true);
  });

  it('returns complexity fix for cognitive complexity message', () => {
    const issue = makeIssue('CRITICAL', 'CODE_SMELL', {
      message: 'Cognitive complexity is too high',
    });
    const fix = getCodeSmellFix(issue);
    expect(fix.description).toMatch(/complexity/i);
  });

  it('returns complexity fix for rule S3776', () => {
    const issue = makeIssue('MAJOR', 'CODE_SMELL', { rule: 'S3776', message: 'Complex method' });
    const fix = getCodeSmellFix(issue);
    expect(fix.description).toMatch(/complexity/i);
  });

  it('returns naming fix for message containing "naming convention"', () => {
    const issue = makeIssue('MINOR', 'CODE_SMELL', { message: 'Naming convention violation' });
    const fix = getCodeSmellFix(issue);
    expect(fix.description).toMatch(/naming/i);
  });

  it('returns naming fix for rule S100', () => {
    const issue = makeIssue('MINOR', 'CODE_SMELL', { rule: 'S100', message: 'Rename this' });
    const fix = getCodeSmellFix(issue);
    expect(fix.description).toMatch(/naming/i);
  });

  it('returns default fix for unrecognized code smell', () => {
    const issue = makeIssue('INFO', 'CODE_SMELL', { rule: 'S9999', message: 'Unknown smell' });
    const fix = getCodeSmellFix(issue);
    expect(fix.preservesFunctionality).toBe(true);
    expect(fix.steps.length).toBeGreaterThan(0);
  });

  it('every fix has at least one step', () => {
    const rules = ['S1192', 'S3776', 'S100', 'S9999'];
    for (const rule of rules) {
      const issue = makeIssue('MAJOR', 'CODE_SMELL', { rule, message: 'test' });
      expect(getCodeSmellFix(issue).steps.length).toBeGreaterThan(0);
    }
  });
});

// ─── IssueResolutionQueue ─────────────────────────────────────────────────────

describe('IssueResolutionQueue', () => {
  it('starts with correct size', () => {
    const q = new IssueResolutionQueue([makeIssue('MAJOR'), makeIssue('MINOR')]);
    expect(q.size).toBe(2);
  });

  it('isEmpty is true for empty queue', () => {
    expect(new IssueResolutionQueue([]).isEmpty).toBe(true);
  });

  it('isEmpty is false for non-empty queue', () => {
    expect(new IssueResolutionQueue([makeIssue('INFO')]).isEmpty).toBe(false);
  });

  it('peek returns the highest-priority issue without removing it', () => {
    const blocker = makeIssue('BLOCKER');
    const minor = makeIssue('MINOR');
    const q = new IssueResolutionQueue([minor, blocker]);
    expect(q.peek()?.severity).toBe('BLOCKER');
    expect(q.size).toBe(2); // not removed
  });

  it('dequeue removes and returns the highest-priority issue', () => {
    const blocker = makeIssue('BLOCKER');
    const info = makeIssue('INFO');
    const q = new IssueResolutionQueue([info, blocker]);
    const first = q.dequeue();
    expect(first?.severity).toBe('BLOCKER');
    expect(q.size).toBe(1);
  });

  it('dequeue returns undefined on empty queue', () => {
    const q = new IssueResolutionQueue([]);
    expect(q.dequeue()).toBeUndefined();
  });

  it('orders BLOCKER before CRITICAL before MAJOR before MINOR before INFO', () => {
    const issues = [
      makeIssue('INFO'),
      makeIssue('MINOR'),
      makeIssue('MAJOR'),
      makeIssue('CRITICAL'),
      makeIssue('BLOCKER'),
    ];
    const q = new IssueResolutionQueue(issues);
    const order = q.toArray().map(i => i.severity);
    expect(order).toEqual(['BLOCKER', 'CRITICAL', 'MAJOR', 'MINOR', 'INFO']);
  });

  it('places VULNERABILITY before BUG within the same severity', () => {
    const bug = makeIssue('CRITICAL', 'BUG');
    const vuln = makeIssue('CRITICAL', 'VULNERABILITY');
    const q = new IssueResolutionQueue([bug, vuln]);
    expect(q.peek()?.type).toBe('VULNERABILITY');
  });

  it('toArray is non-destructive', () => {
    const q = new IssueResolutionQueue([makeIssue('MAJOR'), makeIssue('MINOR')]);
    q.toArray();
    expect(q.size).toBe(2);
  });
});

// ─── createResolutionQueue ────────────────────────────────────────────────────

describe('createResolutionQueue', () => {
  it('returns an IssueResolutionQueue instance', () => {
    const q = createResolutionQueue([makeIssue('MAJOR')]);
    expect(q).toBeInstanceOf(IssueResolutionQueue);
  });

  it('creates an empty queue from empty input', () => {
    const q = createResolutionQueue([]);
    expect(q.isEmpty).toBe(true);
  });

  it('queue from createResolutionQueue has correct size', () => {
    const issues = [makeIssue('BLOCKER'), makeIssue('INFO'), makeIssue('MAJOR')];
    const q = createResolutionQueue(issues);
    expect(q.size).toBe(3);
  });
});
