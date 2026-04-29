/**
 * Property-Based Tests: Issue Resolution
 *
 * **Validates: Requirements 2.1, 2.2, 2.3**
 *
 * Property 5: Issue Severity Categorization Accuracy
 *   For any collection of code quality issues, the Issue_Resolver SHALL correctly
 *   categorize each issue by its appropriate severity level (Blocker, Critical,
 *   Major, Minor, Info) based on established criteria.
 *
 * Property 6: Security Vulnerability Prioritization
 *   For any detected security vulnerability, the Issue_Resolver SHALL prioritize
 *   it above all other issue types in the resolution queue, regardless of other
 *   issue volumes or types present.
 *
 * Property 7: Code Smell Resolution Effectiveness
 *   For any identified code smell (duplicated code, complex methods, naming
 *   violations), the Issue_Resolver SHALL apply appropriate fixes that eliminate
 *   the smell while preserving original functionality.
 *
 * Sub-properties tested:
 *
 * Property 5:
 *   P5a – For any list of issues, each issue lands in exactly the bucket matching its severity
 *   P5b – The total count across all buckets equals the input length
 *   P5c – No issue appears in more than one bucket
 *
 * Property 6:
 *   P6a – For any list with at least one VULNERABILITY, prioritizeSecurityIssues puts all
 *         vulnerabilities before all non-vulnerabilities
 *   P6b – Within the vulnerability group, ordering is by severity (BLOCKER first)
 *   P6c – createResolutionQueue always puts VULNERABILITY issues before non-VULNERABILITY
 *         issues of the same severity
 *
 * Property 7:
 *   P7a – For any CODE_SMELL issue, getCodeSmellFix always returns a fix with
 *         preservesFunctionality=true
 *   P7b – Every fix has a non-empty description and at least one step
 *   P7c – Fixes for duplicated code rules always mention "duplicat" in description
 *   P7d – Fixes for complexity rules always mention "complex" in description
 */

import { describe, it } from 'vitest';
import * as fc from 'fast-check';
import type { CodeIssue, IssueSeverity, IssueType } from '../sonarqube/types';
import {
  categorizeIssues,
  prioritizeSecurityIssues,
  createResolutionQueue,
  getCodeSmellFix,
} from '../sonarqube/issueResolution';

// ─── Arbitraries ─────────────────────────────────────────────────────────────

const severityArb: fc.Arbitrary<IssueSeverity> = fc.constantFrom(
  'BLOCKER' as const,
  'CRITICAL' as const,
  'MAJOR' as const,
  'MINOR' as const,
  'INFO' as const,
);

const issueTypeArb: fc.Arbitrary<IssueType> = fc.constantFrom(
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

const nonEmptyStringArb = fc
  .string({ minLength: 1, maxLength: 40 })
  .filter(s => s.trim().length > 0);

/** Generates a complete CodeIssue with arbitrary severity and type. */
const codeIssueArb: fc.Arbitrary<CodeIssue> = fc.record({
  id: nonEmptyStringArb,
  projectKey: nonEmptyStringArb,
  component: nonEmptyStringArb,
  line: fc.nat({ max: 9999 }),
  severity: severityArb,
  type: issueTypeArb,
  rule: nonEmptyStringArb,
  message: nonEmptyStringArb,
  status: issueStatusArb,
  creationDate: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
  updateDate: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
});

/** Generates a list of CodeIssues (0–30 items). */
const codeIssueListArb: fc.Arbitrary<CodeIssue[]> = fc.array(codeIssueArb, {
  minLength: 0,
  maxLength: 30,
});

/** Generates a list with at least one VULNERABILITY issue. */
const listWithVulnerabilityArb: fc.Arbitrary<CodeIssue[]> = fc
  .tuple(
    // At least one vulnerability
    fc.array(
      fc.record({
        id: nonEmptyStringArb,
        projectKey: nonEmptyStringArb,
        component: nonEmptyStringArb,
        line: fc.nat({ max: 9999 }),
        severity: severityArb,
        type: fc.constant('VULNERABILITY' as const),
        rule: nonEmptyStringArb,
        message: nonEmptyStringArb,
        status: issueStatusArb,
        creationDate: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
        updateDate: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
      }),
      { minLength: 1, maxLength: 10 },
    ),
    // Zero or more non-vulnerability issues
    fc.array(
      fc.record({
        id: nonEmptyStringArb,
        projectKey: nonEmptyStringArb,
        component: nonEmptyStringArb,
        line: fc.nat({ max: 9999 }),
        severity: severityArb,
        type: fc.constantFrom('BUG' as const, 'CODE_SMELL' as const),
        rule: nonEmptyStringArb,
        message: nonEmptyStringArb,
        status: issueStatusArb,
        creationDate: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
        updateDate: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
      }),
      { minLength: 0, maxLength: 10 },
    ),
  )
  .map(([vulns, others]) => [...vulns, ...others]);

/** Generates a CODE_SMELL issue with a duplicated-code rule/message. */
const duplicatedCodeIssueArb: fc.Arbitrary<CodeIssue> = fc.record({
  id: nonEmptyStringArb,
  projectKey: nonEmptyStringArb,
  component: nonEmptyStringArb,
  line: fc.nat({ max: 9999 }),
  severity: severityArb,
  type: fc.constant('CODE_SMELL' as const),
  rule: fc.constantFrom('S1192', 'S4144', 'common-java:DuplicatedBlocks'),
  message: nonEmptyStringArb,
  status: issueStatusArb,
  creationDate: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
  updateDate: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
});

/** Generates a CODE_SMELL issue with a complexity rule/message. */
const complexityIssueArb: fc.Arbitrary<CodeIssue> = fc.record({
  id: nonEmptyStringArb,
  projectKey: nonEmptyStringArb,
  component: nonEmptyStringArb,
  line: fc.nat({ max: 9999 }),
  severity: severityArb,
  type: fc.constant('CODE_SMELL' as const),
  rule: fc.constantFrom('S3776', 'S1541'),
  message: nonEmptyStringArb,
  status: issueStatusArb,
  creationDate: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
  updateDate: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
});

/** Generates a generic CODE_SMELL issue (any rule/message). */
const codeSmellIssueArb: fc.Arbitrary<CodeIssue> = fc.record({
  id: nonEmptyStringArb,
  projectKey: nonEmptyStringArb,
  component: nonEmptyStringArb,
  line: fc.nat({ max: 9999 }),
  severity: severityArb,
  type: fc.constant('CODE_SMELL' as const),
  rule: nonEmptyStringArb,
  message: nonEmptyStringArb,
  status: issueStatusArb,
  creationDate: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
  updateDate: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
});

// ─── Severity ordering (mirrors implementation) ───────────────────────────────

const SEVERITY_ORDER: Record<IssueSeverity, number> = {
  BLOCKER: 0,
  CRITICAL: 1,
  MAJOR: 2,
  MINOR: 3,
  INFO: 4,
};

// ─── Tests: Property 5 – Issue Severity Categorization Accuracy ───────────────

describe('Property 5: Issue Severity Categorization Accuracy (Validates: Requirements 2.1)', () => {

  /**
   * P5a – For any list of issues, each issue lands in exactly the bucket
   * matching its severity field.
   */
  it('P5a: each issue is placed in the bucket matching its severity', () => {
    fc.assert(
      fc.property(codeIssueListArb, (issues) => {
        const categorized = categorizeIssues(issues);
        return issues.every(issue => categorized[issue.severity].some(i => i.id === issue.id));
      }),
    );
  });

  /**
   * P5b – The total count across all buckets equals the input length.
   */
  it('P5b: total count across all buckets equals the input length', () => {
    fc.assert(
      fc.property(codeIssueListArb, (issues) => {
        const categorized = categorizeIssues(issues);
        const total =
          categorized.BLOCKER.length +
          categorized.CRITICAL.length +
          categorized.MAJOR.length +
          categorized.MINOR.length +
          categorized.INFO.length;
        return total === issues.length;
      }),
    );
  });

  /**
   * P5c – No issue appears in more than one bucket.
   */
  it('P5c: no issue appears in more than one bucket', () => {
    fc.assert(
      fc.property(codeIssueListArb, (issues) => {
        const categorized = categorizeIssues(issues);
        const allIds = [
          ...categorized.BLOCKER,
          ...categorized.CRITICAL,
          ...categorized.MAJOR,
          ...categorized.MINOR,
          ...categorized.INFO,
        ].map(i => i.id);
        return allIds.length === new Set(allIds).size;
      }),
    );
  });
});

// ─── Tests: Property 6 – Security Vulnerability Prioritization ───────────────

describe('Property 6: Security Vulnerability Prioritization (Validates: Requirements 2.2)', () => {

  /**
   * P6a – For any list with at least one VULNERABILITY, prioritizeSecurityIssues
   * puts all vulnerabilities before all non-vulnerabilities.
   */
  it('P6a: all VULNERABILITY issues appear before all non-VULNERABILITY issues', () => {
    fc.assert(
      fc.property(listWithVulnerabilityArb, (issues) => {
        const sorted = prioritizeSecurityIssues(issues);
        let seenNonVuln = false;
        for (const issue of sorted) {
          if (issue.type !== 'VULNERABILITY') {
            seenNonVuln = true;
          }
          if (seenNonVuln && issue.type === 'VULNERABILITY') {
            return false; // a vulnerability appeared after a non-vulnerability
          }
        }
        return true;
      }),
    );
  });

  /**
   * P6b – Within the vulnerability group, ordering is by severity (BLOCKER first).
   */
  it('P6b: within vulnerabilities, ordering is by severity (BLOCKER first)', () => {
    fc.assert(
      fc.property(listWithVulnerabilityArb, (issues) => {
        const sorted = prioritizeSecurityIssues(issues);
        const vulns = sorted.filter(i => i.type === 'VULNERABILITY');
        for (let i = 1; i < vulns.length; i++) {
          if (SEVERITY_ORDER[vulns[i].severity] < SEVERITY_ORDER[vulns[i - 1].severity]) {
            return false;
          }
        }
        return true;
      }),
    );
  });

  /**
   * P6c – createResolutionQueue always puts VULNERABILITY issues before
   * non-VULNERABILITY issues of the same severity.
   */
  it('P6c: createResolutionQueue puts VULNERABILITY before non-VULNERABILITY at same severity', () => {
    fc.assert(
      fc.property(
        // Build a list that has both a VULNERABILITY and a non-VULNERABILITY at the same severity
        severityArb,
        fc.record({
          id: nonEmptyStringArb,
          projectKey: nonEmptyStringArb,
          component: nonEmptyStringArb,
          line: fc.nat({ max: 9999 }),
          rule: nonEmptyStringArb,
          message: nonEmptyStringArb,
          status: issueStatusArb,
          creationDate: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
          updateDate: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
        }),
        fc.record({
          id: nonEmptyStringArb,
          projectKey: nonEmptyStringArb,
          component: nonEmptyStringArb,
          line: fc.nat({ max: 9999 }),
          rule: nonEmptyStringArb,
          message: nonEmptyStringArb,
          status: issueStatusArb,
          creationDate: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
          updateDate: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
        }),
        (severity, vulnBase, nonVulnBase) => {
          const vuln: CodeIssue = { ...vulnBase, severity, type: 'VULNERABILITY' };
          const nonVuln: CodeIssue = { ...nonVulnBase, severity, type: 'BUG' };
          const queue = createResolutionQueue([nonVuln, vuln]);
          const items = queue.toArray();
          const vulnIdx = items.findIndex(i => i.type === 'VULNERABILITY');
          const nonVulnIdx = items.findIndex(i => i.type !== 'VULNERABILITY');
          // If both exist, vulnerability must come first
          if (vulnIdx === -1 || nonVulnIdx === -1) return true;
          return vulnIdx < nonVulnIdx;
        },
      ),
    );
  });
});

// ─── Tests: Property 7 – Code Smell Resolution Effectiveness ─────────────────

describe('Property 7: Code Smell Resolution Effectiveness (Validates: Requirements 2.3)', () => {

  /**
   * P7a – For any CODE_SMELL issue, getCodeSmellFix always returns a fix
   * with preservesFunctionality=true.
   */
  it('P7a: getCodeSmellFix always returns a fix with preservesFunctionality=true', () => {
    fc.assert(
      fc.property(codeSmellIssueArb, (issue) => {
        const fix = getCodeSmellFix(issue);
        return fix.preservesFunctionality === true;
      }),
    );
  });

  /**
   * P7b – Every fix has a non-empty description and at least one step.
   */
  it('P7b: every fix has a non-empty description and at least one step', () => {
    fc.assert(
      fc.property(codeSmellIssueArb, (issue) => {
        const fix = getCodeSmellFix(issue);
        return (
          typeof fix.description === 'string' &&
          fix.description.trim().length > 0 &&
          Array.isArray(fix.steps) &&
          fix.steps.length >= 1
        );
      }),
    );
  });

  /**
   * P7c – Fixes for duplicated code rules always mention "duplicat" in description.
   */
  it('P7c: fixes for duplicated code rules mention "duplicat" in description', () => {
    fc.assert(
      fc.property(duplicatedCodeIssueArb, (issue) => {
        const fix = getCodeSmellFix(issue);
        return fix.description.toLowerCase().includes('duplicat');
      }),
    );
  });

  /**
   * P7d – Fixes for complexity rules always mention "complex" in description.
   */
  it('P7d: fixes for complexity rules mention "complex" in description', () => {
    fc.assert(
      fc.property(complexityIssueArb, (issue) => {
        const fix = getCodeSmellFix(issue);
        return fix.description.toLowerCase().includes('complex');
      }),
    );
  });
});
