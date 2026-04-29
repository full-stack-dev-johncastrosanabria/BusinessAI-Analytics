/**
 * Analysis Report Generation
 *
 * Generates detailed analysis reports from SonarQube issue search results.
 * Implements the Code_Scanner report generation logic described in Requirement 1.5:
 *   "WHERE SonarQube analysis is triggered, THE Code_Scanner SHALL generate detailed
 *    reports with file-level issue identification."
 */

import type { CodeIssue, IssueSearchResult } from './types';

/** Required fields that every issue in a report must have. */
export const REQUIRED_ISSUE_FIELDS: ReadonlyArray<keyof CodeIssue> = [
  'id',
  'component',
  'severity',
  'type',
  'rule',
  'message',
  'status',
  'creationDate',
  'updateDate',
];

/** Per-file summary within an analysis report. */
export interface FileReport {
  /** The component key (file path) as returned by SonarQube. */
  component: string;
  /** All issues belonging to this file. */
  issues: CodeIssue[];
  /** Number of issues in this file. */
  issueCount: number;
}

/** Full analysis report produced by generateAnalysisReport. */
export interface AnalysisReport {
  /** Project key that was analyzed. */
  projectKey: string;
  /** ISO timestamp of when the report was generated. */
  generatedAt: string;
  /** Total number of issues across all files. */
  totalIssues: number;
  /** Per-file breakdown of issues. */
  fileReports: FileReport[];
  /** All issues in a flat list (same objects as in fileReports). */
  allIssues: CodeIssue[];
}

/**
 * Generates a detailed analysis report from an IssueSearchResult.
 *
 * The report groups issues by their `component` field (file path) and
 * ensures every analyzed file has an entry, even if it has zero issues.
 *
 * @param result       - The paginated issue search result from SonarQube.
 * @param analyzedFiles - The set of file component keys that were analyzed.
 *                        Every file in this set will appear in the report.
 * @returns A complete AnalysisReport with file-level grouping.
 */
export function generateAnalysisReport(
  result: IssueSearchResult,
  analyzedFiles: string[],
): AnalysisReport {
  // Group issues by component (file path)
  const byComponent = new Map<string, CodeIssue[]>();

  // Pre-populate with all analyzed files so every file has an entry
  for (const file of analyzedFiles) {
    byComponent.set(file, []);
  }

  // Assign each issue to its component bucket
  for (const issue of result.issues) {
    const bucket = byComponent.get(issue.component);
    if (bucket !== undefined) {
      bucket.push(issue);
    } else {
      // Issue belongs to a component not in the analyzed set — still include it
      byComponent.set(issue.component, [issue]);
    }
  }

  const fileReports: FileReport[] = Array.from(byComponent.entries()).map(
    ([component, issues]) => ({
      component,
      issues,
      issueCount: issues.length,
    }),
  );

  return {
    projectKey: result.issues[0]?.projectKey ?? '',
    generatedAt: new Date().toISOString(),
    totalIssues: result.issues.length,
    fileReports,
    allIssues: result.issues,
  };
}

/**
 * Validates that a CodeIssue has all required fields populated (non-null,
 * non-undefined, non-empty string where applicable).
 *
 * Returns an array of missing/invalid field names. An empty array means the
 * issue is complete.
 */
export function validateIssueCompleteness(issue: CodeIssue): string[] {
  const missing: string[] = [];

  for (const field of REQUIRED_ISSUE_FIELDS) {
    const value = issue[field];
    if (value === undefined || value === null) {
      missing.push(field);
    } else if (typeof value === 'string' && value.trim() === '') {
      missing.push(field);
    }
  }

  return missing;
}

/**
 * Returns true when the report contains an entry for every file in
 * `analyzedFiles` (i.e., no file is missing from the report).
 */
export function reportCoversAllFiles(
  report: AnalysisReport,
  analyzedFiles: string[],
): boolean {
  const reportedComponents = new Set(report.fileReports.map(fr => fr.component));
  return analyzedFiles.every(f => reportedComponents.has(f));
}

/**
 * Returns true when every issue's component maps to a known analyzed file.
 * (The inverse direction of reportCoversAllFiles.)
 */
export function allIssueComponentsAreKnown(
  report: AnalysisReport,
  analyzedFiles: string[],
): boolean {
  const knownFiles = new Set(analyzedFiles);
  return report.allIssues.every(issue => knownFiles.has(issue.component));
}
