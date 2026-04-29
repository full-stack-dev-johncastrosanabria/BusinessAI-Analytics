/**
 * Issue Resolution Engine
 *
 * Provides issue categorization, security vulnerability prioritization,
 * code smell resolution guidance, and resolution tracking.
 *
 * Supports Requirements 2.1, 2.2, 2.3:
 *   - 2.1: Categorize all issues by severity (Blocker, Critical, Major, Minor, Info)
 *   - 2.2: Prioritize security vulnerabilities for immediate resolution
 *   - 2.3: Fix code smells including duplicated code, complex methods, naming violations
 */

import type { CodeIssue, IssueSeverity } from './types';

// ─── Interfaces ───────────────────────────────────────────────────────────────

/** Issues grouped by severity level. */
export interface CategorizedIssues {
  BLOCKER: CodeIssue[];
  CRITICAL: CodeIssue[];
  MAJOR: CodeIssue[];
  MINOR: CodeIssue[];
  INFO: CodeIssue[];
}

/** Specific fix guidance for a code smell issue. */
export interface CodeSmellFix {
  /** Short description of the fix to apply. */
  description: string;
  /** Ordered steps to resolve the code smell. */
  steps: string[];
  /** Whether applying this fix preserves the original functionality. */
  preservesFunctionality: boolean;
}

/** Tracks the resolution state of a single issue. */
export interface ResolutionResult {
  issueId: string;
  status: 'resolved' | 'skipped' | 'pending';
  resolution?: string;
}

// ─── Severity ordering ────────────────────────────────────────────────────────

/** Numeric priority for each severity — lower = higher priority. */
const SEVERITY_ORDER: Record<IssueSeverity, number> = {
  BLOCKER: 0,
  CRITICAL: 1,
  MAJOR: 2,
  MINOR: 3,
  INFO: 4,
};

// ─── Issue Categorization ─────────────────────────────────────────────────────

/**
 * Groups a list of issues by their severity level.
 *
 * Supports Requirement 2.1: categorize all issues by severity.
 */
export function categorizeIssues(issues: CodeIssue[]): CategorizedIssues {
  const result: CategorizedIssues = {
    BLOCKER: [],
    CRITICAL: [],
    MAJOR: [],
    MINOR: [],
    INFO: [],
  };

  for (const issue of issues) {
    result[issue.severity].push(issue);
  }

  return result;
}

// ─── Security Vulnerability Prioritization ────────────────────────────────────

/**
 * Returns issues sorted so that VULNERABILITY type always appears before
 * non-vulnerability issues. Within each group, issues are ordered by severity.
 *
 * Supports Requirement 2.2: prioritize security vulnerabilities.
 */
export function prioritizeSecurityIssues(issues: CodeIssue[]): CodeIssue[] {
  return [...issues].sort((a, b) => {
    const aIsVuln = a.type === 'VULNERABILITY' ? 0 : 1;
    const bIsVuln = b.type === 'VULNERABILITY' ? 0 : 1;

    if (aIsVuln !== bIsVuln) {
      return aIsVuln - bIsVuln;
    }

    return SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
  });
}

// ─── Code Smell Resolution Guidance ──────────────────────────────────────────

/** Known code smell rule patterns and their fix strategies. */
const CODE_SMELL_FIXES: Array<{
  match: (issue: CodeIssue) => boolean;
  fix: CodeSmellFix;
}> = [
  // Duplicated code
  {
    match: (issue) =>
      issue.message.toLowerCase().includes('duplicat') ||
      issue.rule.includes('S1192') ||
      issue.rule.includes('S4144') ||
      issue.rule.includes('common-java:DuplicatedBlocks'),
    fix: {
      description: 'Extract duplicated code into a shared function or constant.',
      steps: [
        'Identify all locations where the duplicated code appears.',
        'Create a new shared function or constant that encapsulates the common logic.',
        'Replace each duplicated occurrence with a call to the new shared function.',
        'Run existing tests to confirm behavior is unchanged.',
      ],
      preservesFunctionality: true,
    },
  },
  // Complex methods / high cognitive complexity
  {
    match: (issue) =>
      issue.message.toLowerCase().includes('cognitive complexity') ||
      issue.message.toLowerCase().includes('cyclomatic complexity') ||
      issue.rule.includes('S3776') ||
      issue.rule.includes('S1541'),
    fix: {
      description: 'Reduce method complexity by extracting sub-methods.',
      steps: [
        'Identify logical sub-sections within the complex method.',
        'Extract each sub-section into a well-named private helper method.',
        'Replace nested conditionals with early returns or guard clauses where possible.',
        'Verify the refactored method has a cognitive complexity score below the threshold.',
        'Run existing tests to confirm behavior is unchanged.',
      ],
      preservesFunctionality: true,
    },
  },
  // Naming violations
  {
    match: (issue) =>
      issue.message.toLowerCase().includes('naming convention') ||
      issue.message.toLowerCase().includes('rename') ||
      issue.rule.includes('S100') ||
      issue.rule.includes('S101') ||
      issue.rule.includes('S116') ||
      issue.rule.includes('S117') ||
      issue.rule.includes('S118') ||
      issue.rule.includes('S119') ||
      issue.rule.includes('S120'),
    fix: {
      description: 'Rename the identifier to follow established naming conventions.',
      steps: [
        'Identify the naming convention required (camelCase, PascalCase, UPPER_SNAKE_CASE, etc.).',
        'Use an IDE rename refactoring to update all references simultaneously.',
        'Review the change to ensure no string-based references (e.g., reflection, serialization) are missed.',
        'Run existing tests to confirm behavior is unchanged.',
      ],
      preservesFunctionality: true,
    },
  },
];

/** Default fallback fix for unrecognized code smells. */
const DEFAULT_CODE_SMELL_FIX: CodeSmellFix = {
  description: 'Refactor the code to address the identified code smell.',
  steps: [
    'Review the SonarQube issue message and linked rule documentation.',
    'Understand the root cause of the code smell.',
    'Apply the recommended refactoring while keeping the logic equivalent.',
    'Run existing tests to confirm behavior is unchanged.',
  ],
  preservesFunctionality: true,
};

/**
 * Returns specific fix guidance for a code smell issue.
 * Falls back to generic guidance for unrecognized patterns.
 *
 * Supports Requirement 2.3: fix code smells.
 */
export function getCodeSmellFix(issue: CodeIssue): CodeSmellFix {
  for (const entry of CODE_SMELL_FIXES) {
    if (entry.match(issue)) {
      return entry.fix;
    }
  }
  return DEFAULT_CODE_SMELL_FIX;
}

// ─── Priority Queue ───────────────────────────────────────────────────────────

/**
 * A priority queue that orders issues for resolution.
 * Order: BLOCKER → CRITICAL → MAJOR → MINOR → INFO.
 * Within the same severity, VULNERABILITY type issues appear first.
 */
export class IssueResolutionQueue {
  private readonly _items: CodeIssue[];

  constructor(issues: CodeIssue[]) {
    this._items = prioritizeSecurityIssues(issues).sort((a, b) => {
      const severityDiff = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
      if (severityDiff !== 0) return severityDiff;
      // Within same severity, vulnerabilities first
      const aIsVuln = a.type === 'VULNERABILITY' ? 0 : 1;
      const bIsVuln = b.type === 'VULNERABILITY' ? 0 : 1;
      return aIsVuln - bIsVuln;
    });
  }

  /** Returns the next issue to resolve without removing it. */
  peek(): CodeIssue | undefined {
    return this._items[0];
  }

  /** Removes and returns the next issue to resolve. */
  dequeue(): CodeIssue | undefined {
    return this._items.shift();
  }

  /** Returns all remaining issues in priority order (non-destructive). */
  toArray(): CodeIssue[] {
    return [...this._items];
  }

  /** Number of issues remaining in the queue. */
  get size(): number {
    return this._items.length;
  }

  /** Whether the queue is empty. */
  get isEmpty(): boolean {
    return this._items.length === 0;
  }
}

// ─── Resolution Tracking ──────────────────────────────────────────────────────

/**
 * Creates a prioritized resolution queue from a list of issues.
 * Issues are ordered: BLOCKER first, then CRITICAL, MAJOR, MINOR, INFO.
 * Security vulnerabilities are elevated within each severity band.
 */
export function createResolutionQueue(issues: CodeIssue[]): IssueResolutionQueue {
  return new IssueResolutionQueue(issues);
}
