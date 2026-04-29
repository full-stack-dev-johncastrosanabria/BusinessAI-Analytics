/**
 * Property-Based Test: Analysis Report Generation Completeness
 *
 * **Validates: Requirements 1.5**
 *
 * Property 3: For any code analysis execution, the Code_Scanner SHALL generate
 * detailed reports containing file-level issue identification for all analyzed
 * files, with no missing or incomplete issue data.
 *
 * Sub-properties tested:
 *   P3a – For any set of analyzed files, the report contains an entry for every file
 *   P3b – Each issue in the report has all required fields populated
 *   P3c – No required issue field is undefined or null
 *   P3d – The report's totalIssues count matches the actual number of issues returned
 *   P3e – Every issue's component maps to a known analyzed file
 */

import { describe, it } from 'vitest';
import * as fc from 'fast-check';
import type { CodeIssue, IssueSearchResult } from '../sonarqube/types';
import {
  generateAnalysisReport,
  validateIssueCompleteness,
  reportCoversAllFiles,
  allIssueComponentsAreKnown,
  REQUIRED_ISSUE_FIELDS,
} from '../sonarqube/reportGeneration';

// ─── Arbitraries ─────────────────────────────────────────────────────────────

const severityArb = fc.constantFrom(
  'BLOCKER' as const,
  'CRITICAL' as const,
  'MAJOR' as const,
  'MINOR' as const,
  'INFO' as const,
);

const issueTypeArb = fc.constantFrom(
  'BUG' as const,
  'VULNERABILITY' as const,
  'CODE_SMELL' as const,
);

const issueStatusArb = fc.constantFrom(
  'OPEN' as const,
  'CONFIRMED' as const,
  'REOPENED' as const,
  'RESOLVED' as const,
  'CLOSED' as const,
);

/** Generates a non-empty, non-whitespace string identifier. */
const nonEmptyStringArb = fc.string({ minLength: 1, maxLength: 40 }).filter(s => s.trim().length > 0);

/** Generates a valid component key like "project:src/Foo.ts". */
const componentKeyArb = fc.tuple(nonEmptyStringArb, nonEmptyStringArb).map(
  ([proj, file]) => `${proj}:src/${file}.ts`,
);

/** Generates a complete, valid CodeIssue for a given component. */
function codeIssueArb(component: string): fc.Arbitrary<CodeIssue> {
  return fc.record({
    id: nonEmptyStringArb,
    projectKey: nonEmptyStringArb,
    component: fc.constant(component),
    line: fc.nat({ max: 9999 }),
    severity: severityArb,
    type: issueTypeArb,
    rule: nonEmptyStringArb,
    message: nonEmptyStringArb,
    status: issueStatusArb,
    creationDate: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
    updateDate: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
  });
}

/**
 * Generates a list of analyzed file component keys (1–10 files).
 */
const analyzedFilesArb: fc.Arbitrary<string[]> = fc
  .array(componentKeyArb, { minLength: 1, maxLength: 10 })
  .map(files => Array.from(new Set(files))); // deduplicate

/**
 * Generates an IssueSearchResult where every issue's component is one of the
 * provided analyzed files.
 */
function issueSearchResultArb(analyzedFiles: string[]): fc.Arbitrary<IssueSearchResult> {
  if (analyzedFiles.length === 0) {
    return fc.constant({ issues: [], total: 0, page: 1, pageSize: 100 });
  }

  return fc
    .array(
      fc.constantFrom(...analyzedFiles).chain(component => codeIssueArb(component)),
      { minLength: 0, maxLength: 20 },
    )
    .map(issues => ({
      issues,
      total: issues.length,
      page: 1,
      pageSize: 100,
    }));
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('Property 3: Analysis Report Generation Completeness (Validates: Requirements 1.5)', () => {

  /**
   * P3a – For any set of analyzed files, the generated report contains an entry
   * for every file, even if that file has zero issues.
   */
  it('P3a: report contains an entry for every analyzed file', () => {
    fc.assert(
      fc.property(
        analyzedFilesArb.chain(files =>
          fc.tuple(fc.constant(files), issueSearchResultArb(files)),
        ),
        ([analyzedFiles, result]) => {
          const report = generateAnalysisReport(result, analyzedFiles);
          return reportCoversAllFiles(report, analyzedFiles);
        },
      ),
    );
  });

  /**
   * P3b – Each issue in the report has all required fields populated with
   * non-null, non-undefined, non-empty values.
   */
  it('P3b: each issue in the report has all required fields populated', () => {
    fc.assert(
      fc.property(
        analyzedFilesArb.chain(files =>
          fc.tuple(fc.constant(files), issueSearchResultArb(files)),
        ),
        ([analyzedFiles, result]) => {
          const report = generateAnalysisReport(result, analyzedFiles);
          return report.allIssues.every(
            issue => validateIssueCompleteness(issue).length === 0,
          );
        },
      ),
    );
  });

  /**
   * P3c – No required issue field is undefined or null in any file-level report entry.
   */
  it('P3c: no required issue field is undefined or null in file-level entries', () => {
    fc.assert(
      fc.property(
        analyzedFilesArb.chain(files =>
          fc.tuple(fc.constant(files), issueSearchResultArb(files)),
        ),
        ([analyzedFiles, result]) => {
          const report = generateAnalysisReport(result, analyzedFiles);
          for (const fileReport of report.fileReports) {
            for (const issue of fileReport.issues) {
              for (const field of REQUIRED_ISSUE_FIELDS) {
                if (issue[field] === undefined || issue[field] === null) {
                  return false;
                }
              }
            }
          }
          return true;
        },
      ),
    );
  });

  /**
   * P3d – The report's totalIssues count always matches the actual number of
   * issues returned in the search result.
   */
  it('P3d: report totalIssues matches the actual number of issues returned', () => {
    fc.assert(
      fc.property(
        analyzedFilesArb.chain(files =>
          fc.tuple(fc.constant(files), issueSearchResultArb(files)),
        ),
        ([analyzedFiles, result]) => {
          const report = generateAnalysisReport(result, analyzedFiles);
          return report.totalIssues === result.issues.length;
        },
      ),
    );
  });

  /**
   * P3e – Every issue's component maps to a known analyzed file (file-level
   * grouping is complete and consistent).
   */
  it('P3e: every issue component maps to a known analyzed file', () => {
    fc.assert(
      fc.property(
        analyzedFilesArb.chain(files =>
          fc.tuple(fc.constant(files), issueSearchResultArb(files)),
        ),
        ([analyzedFiles, result]) => {
          const report = generateAnalysisReport(result, analyzedFiles);
          return allIssueComponentsAreKnown(report, analyzedFiles);
        },
      ),
    );
  });

  /**
   * P3f – The sum of all per-file issue counts equals the report's totalIssues.
   * This verifies that file-level grouping is complete with no issues lost.
   */
  it('P3f: sum of per-file issue counts equals totalIssues (no issues lost in grouping)', () => {
    fc.assert(
      fc.property(
        analyzedFilesArb.chain(files =>
          fc.tuple(fc.constant(files), issueSearchResultArb(files)),
        ),
        ([analyzedFiles, result]) => {
          const report = generateAnalysisReport(result, analyzedFiles);
          const sumOfFileCounts = report.fileReports.reduce(
            (acc, fr) => acc + fr.issueCount,
            0,
          );
          return sumOfFileCounts === report.totalIssues;
        },
      ),
    );
  });

  /**
   * P3g – Each fileReport's issueCount matches the length of its issues array.
   */
  it('P3g: each fileReport issueCount is consistent with its issues array length', () => {
    fc.assert(
      fc.property(
        analyzedFilesArb.chain(files =>
          fc.tuple(fc.constant(files), issueSearchResultArb(files)),
        ),
        ([analyzedFiles, result]) => {
          const report = generateAnalysisReport(result, analyzedFiles);
          return report.fileReports.every(fr => fr.issueCount === fr.issues.length);
        },
      ),
    );
  });
});
