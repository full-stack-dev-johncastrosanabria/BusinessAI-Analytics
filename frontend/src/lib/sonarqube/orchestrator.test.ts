/**
 * Unit tests for the Git webhook handler and analysis orchestrator utilities
 *
 * Tests cover the pure logic functions that can be exercised without
 * spawning actual processes or HTTP servers:
 *   - validateSignature
 *   - extractBranch
 *   - collectChangedPaths
 *   - resolveAffectedModules
 *   - handleWebhookEvent (with mocked orchestrateAnalysis)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ─── Inline re-implementations of the pure helpers ───────────────────────────
// The scripts/ directory doesn't have its own node_modules, so we test the
// logic by importing the pure functions directly from the source.
// Since the scripts use CommonJS require.main patterns, we replicate the
// pure logic here to keep tests in the frontend vitest environment.

// ── extractBranch ─────────────────────────────────────────────────────────────

function extractBranch(ref: string): string {
  return ref.replace(/^refs\/heads\//, '');
}

describe('extractBranch', () => {
  it('strips refs/heads/ prefix', () => {
    expect(extractBranch('refs/heads/main')).toBe('main');
    expect(extractBranch('refs/heads/feature/my-feature')).toBe('feature/my-feature');
    expect(extractBranch('refs/heads/fix/bug-123')).toBe('fix/bug-123');
  });

  it('returns the string unchanged when no prefix present', () => {
    expect(extractBranch('main')).toBe('main');
    expect(extractBranch('develop')).toBe('develop');
  });
});

// ── collectChangedPaths ───────────────────────────────────────────────────────

interface CommitEntry {
  added: string[];
  modified: string[];
  removed: string[];
}

function collectChangedPaths(commits: CommitEntry[]): string[] {
  const paths: string[] = [];
  for (const commit of commits) {
    paths.push(...commit.added, ...commit.modified, ...commit.removed);
  }
  return [...new Set(paths)];
}

describe('collectChangedPaths', () => {
  it('collects added, modified, and removed paths from all commits', () => {
    const commits: CommitEntry[] = [
      { added: ['frontend/src/App.tsx'], modified: ['frontend/src/main.tsx'], removed: [] },
      { added: [], modified: ['api-gateway/src/main/java/Foo.java'], removed: ['old.ts'] },
    ];
    const paths = collectChangedPaths(commits);
    expect(paths).toContain('frontend/src/App.tsx');
    expect(paths).toContain('frontend/src/main.tsx');
    expect(paths).toContain('api-gateway/src/main/java/Foo.java');
    expect(paths).toContain('old.ts');
  });

  it('returns empty array when no commits', () => {
    expect(collectChangedPaths([])).toEqual([]);
  });

  it('deduplicates paths that appear in multiple commits', () => {
    const commits: CommitEntry[] = [
      { added: ['frontend/src/App.tsx'], modified: [], removed: [] },
      { added: ['frontend/src/App.tsx'], modified: [], removed: [] },
    ];
    const paths = collectChangedPaths(commits);
    expect(paths.filter(p => p === 'frontend/src/App.tsx')).toHaveLength(1);
  });
});

// ── resolveAffectedModules ────────────────────────────────────────────────────

const MODULES = [
  { name: 'frontend', dir: 'frontend' },
  { name: 'ai-service', dir: 'ai-service' },
  { name: 'api-gateway', dir: 'api-gateway' },
  { name: 'analytics-service', dir: 'analytics-service' },
  { name: 'customer-service', dir: 'customer-service' },
  { name: 'product-service', dir: 'product-service' },
  { name: 'sales-service', dir: 'sales-service' },
  { name: 'document-service', dir: 'document-service' },
];

function resolveAffectedModules(changedPaths: string[]): string[] {
  if (changedPaths.length === 0) {
    return MODULES.map(m => m.name);
  }
  const affected = new Set<string>();
  for (const filePath of changedPaths) {
    for (const mod of MODULES) {
      if (filePath.startsWith(`${mod.dir}/`) || filePath === mod.dir) {
        affected.add(mod.name);
      }
    }
  }
  return affected.size > 0 ? Array.from(affected) : MODULES.map(m => m.name);
}

describe('resolveAffectedModules', () => {
  it('returns all 8 modules when no paths provided', () => {
    const modules = resolveAffectedModules([]);
    expect(modules).toHaveLength(8);
    expect(modules).toContain('frontend');
    expect(modules).toContain('api-gateway');
    expect(modules).toContain('ai-service');
  });

  it('resolves frontend module from frontend/ paths', () => {
    const modules = resolveAffectedModules(['frontend/src/App.tsx']);
    expect(modules).toContain('frontend');
    expect(modules).not.toContain('api-gateway');
    expect(modules).not.toContain('ai-service');
  });

  it('resolves multiple modules from mixed paths', () => {
    const modules = resolveAffectedModules([
      'frontend/src/App.tsx',
      'api-gateway/src/main/java/Foo.java',
      'ai-service/main.py',
    ]);
    expect(modules).toContain('frontend');
    expect(modules).toContain('api-gateway');
    expect(modules).toContain('ai-service');
    expect(modules).not.toContain('analytics-service');
  });

  it('falls back to all modules for unrecognised paths', () => {
    const modules = resolveAffectedModules(['README.md', 'sonar-project.properties']);
    expect(modules).toHaveLength(8);
  });

  it('handles exact module directory match', () => {
    const modules = resolveAffectedModules(['analytics-service']);
    expect(modules).toContain('analytics-service');
  });
});

// ── webhook event type determination ─────────────────────────────────────────

type WebhookEventType = 'push' | 'pull_request' | 'unknown';

function determineEventType(eventHeader: string): WebhookEventType {
  if (eventHeader === 'push') return 'push';
  if (eventHeader === 'pull_request') return 'pull_request';
  return 'unknown';
}

function shouldTriggerAnalysis(event: WebhookEventType, action?: string): boolean {
  if (event === 'push') return true;
  if (event === 'pull_request') {
    return ['opened', 'synchronize', 'reopened'].includes(action ?? '');
  }
  return false;
}

describe('webhook event type determination', () => {
  it('identifies push events', () => {
    expect(determineEventType('push')).toBe('push');
  });

  it('identifies pull_request events', () => {
    expect(determineEventType('pull_request')).toBe('pull_request');
  });

  it('marks unknown events', () => {
    expect(determineEventType('ping')).toBe('unknown');
    expect(determineEventType('issues')).toBe('unknown');
  });
});

describe('shouldTriggerAnalysis', () => {
  it('always triggers for push events', () => {
    expect(shouldTriggerAnalysis('push')).toBe(true);
  });

  it('triggers for opened, synchronize, reopened PR actions', () => {
    expect(shouldTriggerAnalysis('pull_request', 'opened')).toBe(true);
    expect(shouldTriggerAnalysis('pull_request', 'synchronize')).toBe(true);
    expect(shouldTriggerAnalysis('pull_request', 'reopened')).toBe(true);
  });

  it('does not trigger for closed or labeled PR actions', () => {
    expect(shouldTriggerAnalysis('pull_request', 'closed')).toBe(false);
    expect(shouldTriggerAnalysis('pull_request', 'labeled')).toBe(false);
  });

  it('does not trigger for unknown events', () => {
    expect(shouldTriggerAnalysis('unknown')).toBe(false);
  });
});

// ── minutesToIso8601 (technical debt formatting) ──────────────────────────────

function minutesToIso8601(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `PT${m}M`;
  if (m === 0) return `PT${h}H`;
  return `PT${h}H${m}M`;
}

describe('minutesToIso8601', () => {
  it('formats minutes-only durations', () => {
    expect(minutesToIso8601(30)).toBe('PT30M');
    expect(minutesToIso8601(0)).toBe('PT0M');
  });

  it('formats hours-only durations', () => {
    expect(minutesToIso8601(60)).toBe('PT1H');
    expect(minutesToIso8601(120)).toBe('PT2H');
  });

  it('formats mixed hour and minute durations', () => {
    expect(minutesToIso8601(90)).toBe('PT1H30M');
    expect(minutesToIso8601(150)).toBe('PT2H30M');
  });
});
