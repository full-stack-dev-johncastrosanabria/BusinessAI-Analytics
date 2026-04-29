/**
 * Actionable Recommendations System
 *
 * Maps issue types and severities to specific, implementable guidance.
 * Supports Requirement 1.7: "WHEN analysis completes, THE Quality_Dashboard
 * SHALL provide actionable recommendations for issue resolution."
 */

import type { CodeIssue, IssueSeverity, IssueType } from './types';

export interface Recommendation {
  /** Short title summarizing the action. */
  title: string;
  /** Detailed, implementable guidance. */
  description: string;
  /** Estimated effort level. */
  effort: 'low' | 'medium' | 'high';
  /** Priority order — lower number = higher priority. */
  priority: number;
  /** Optional link to documentation or reference. */
  documentationUrl?: string;
}

// ─── Severity-based recommendations ──────────────────────────────────────────

const SEVERITY_RECOMMENDATIONS: Record<IssueSeverity, Recommendation> = {
  BLOCKER: {
    title: 'Fix blocker issues immediately',
    description:
      'Blocker issues prevent the application from functioning correctly or introduce critical security risks. ' +
      'Address these before any other work. Review the issue details, apply the suggested fix, and add a regression test.',
    effort: 'high',
    priority: 1,
  },
  CRITICAL: {
    title: 'Resolve critical issues in current sprint',
    description:
      'Critical issues represent significant bugs or security vulnerabilities that could impact users. ' +
      'Schedule these for the current sprint. Prioritize security-related critical issues first.',
    effort: 'high',
    priority: 2,
  },
  MAJOR: {
    title: 'Address major issues in upcoming sprint',
    description:
      'Major issues affect code quality and maintainability. Plan to resolve these in the next sprint. ' +
      'Consider grouping related issues for efficient resolution.',
    effort: 'medium',
    priority: 3,
  },
  MINOR: {
    title: 'Schedule minor issues for backlog cleanup',
    description:
      'Minor issues are low-risk improvements. Add them to your technical debt backlog and address ' +
      'them during refactoring sessions or when working in the affected files.',
    effort: 'low',
    priority: 4,
  },
  INFO: {
    title: 'Review informational findings',
    description:
      'Informational findings are suggestions for improvement. Review them periodically and apply ' +
      'relevant ones during code reviews or refactoring sessions.',
    effort: 'low',
    priority: 5,
  },
};

// ─── Type-based recommendations ───────────────────────────────────────────────

const TYPE_RECOMMENDATIONS: Record<IssueType, Recommendation> = {
  BUG: {
    title: 'Fix bug to prevent runtime failures',
    description:
      'This issue represents a coding mistake that could cause incorrect behavior at runtime. ' +
      'Review the flagged code, understand the root cause, write a failing test that reproduces the bug, ' +
      'then apply the fix and verify the test passes.',
    effort: 'medium',
    priority: 1,
    documentationUrl: 'https://docs.sonarqube.org/latest/user-guide/rules/overview/',
  },
  VULNERABILITY: {
    title: 'Patch security vulnerability immediately',
    description:
      'This issue is a security vulnerability that could be exploited by attackers. ' +
      'Treat this as highest priority. Apply the recommended fix, review similar patterns in the codebase, ' +
      'and consider a security audit of the affected module. Do not deploy until resolved.',
    effort: 'high',
    priority: 1,
    documentationUrl: 'https://owasp.org/www-project-top-ten/',
  },
  CODE_SMELL: {
    title: 'Refactor code smell to reduce technical debt',
    description:
      'This issue is a maintainability problem that makes the code harder to understand or modify. ' +
      'Refactor the flagged code following clean code principles. Common fixes include extracting methods, ' +
      'renaming variables for clarity, removing duplication, and simplifying complex conditionals.',
    effort: 'low',
    priority: 3,
    documentationUrl: 'https://refactoring.guru/refactoring',
  },
};

// ─── Rule-specific recommendations ───────────────────────────────────────────

const RULE_RECOMMENDATIONS: Record<string, Recommendation> = {
  // TypeScript / JavaScript
  'typescript:S1854': {
    title: 'Remove unused variable assignments',
    description: 'Delete or use the assigned value. If the variable is needed later, ensure it is read before reassignment.',
    effort: 'low',
    priority: 4,
  },
  'typescript:S3776': {
    title: 'Reduce cognitive complexity',
    description:
      'Break down complex functions into smaller, focused helpers. Extract nested conditionals into well-named methods. ' +
      'Aim for a cognitive complexity score below 15.',
    effort: 'medium',
    priority: 3,
  },
  'typescript:S1192': {
    title: 'Extract duplicated string literals to constants',
    description: 'Define a named constant for the repeated string and replace all occurrences. Place it in a shared constants file.',
    effort: 'low',
    priority: 4,
  },
  // Java
  'java:S2259': {
    title: 'Add null check before dereferencing',
    description: 'Add an explicit null check or use Optional<T> to safely handle potentially null values before accessing their members.',
    effort: 'low',
    priority: 2,
  },
  'java:S1135': {
    title: 'Resolve or remove TODO comments',
    description: 'Either implement the TODO item and remove the comment, or create a tracked issue and remove the comment from code.',
    effort: 'low',
    priority: 5,
  },
  'java:S2095': {
    title: 'Close resources in try-with-resources',
    description: 'Wrap resource-opening statements in a try-with-resources block to ensure proper cleanup even when exceptions occur.',
    effort: 'low',
    priority: 2,
  },
  // Python
  'python:S1481': {
    title: 'Remove unused local variables',
    description: 'Delete the variable declaration if it is not needed, or use it in the function logic.',
    effort: 'low',
    priority: 4,
  },
  'python:S5754': {
    title: 'Catch specific exceptions instead of bare except',
    description: 'Replace bare `except:` clauses with specific exception types (e.g., `except ValueError:`). This prevents masking unexpected errors.',
    effort: 'low',
    priority: 3,
  },
};

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns a recommendation for a specific issue rule.
 * Falls back to type-based, then severity-based recommendations.
 */
export function getRecommendationForIssue(issue: CodeIssue): Recommendation {
  if (issue.rule in RULE_RECOMMENDATIONS) {
    return RULE_RECOMMENDATIONS[issue.rule];
  }
  if (issue.type in TYPE_RECOMMENDATIONS) {
    return TYPE_RECOMMENDATIONS[issue.type];
  }
  return SEVERITY_RECOMMENDATIONS[issue.severity];
}

/**
 * Returns the severity-based recommendation for a given severity level.
 */
export function getRecommendationBySeverity(severity: IssueSeverity): Recommendation {
  return SEVERITY_RECOMMENDATIONS[severity];
}

/**
 * Returns the type-based recommendation for a given issue type.
 */
export function getRecommendationByType(type: IssueType): Recommendation {
  return TYPE_RECOMMENDATIONS[type];
}

/**
 * Generates a prioritized list of unique recommendations from a set of issues.
 * Deduplicates by title and sorts by priority (ascending = most important first).
 */
export function generateRecommendations(issues: CodeIssue[]): Recommendation[] {
  const seen = new Set<string>();
  const recommendations: Recommendation[] = [];

  for (const issue of issues) {
    const rec = getRecommendationForIssue(issue);
    if (!seen.has(rec.title)) {
      seen.add(rec.title);
      recommendations.push(rec);
    }
  }

  return recommendations.sort((a, b) => a.priority - b.priority);
}

/**
 * Returns the top N recommendations from a set of issues.
 * Useful for dashboard summary views.
 */
export function getTopRecommendations(issues: CodeIssue[], limit = 5): Recommendation[] {
  return generateRecommendations(issues).slice(0, limit);
}
