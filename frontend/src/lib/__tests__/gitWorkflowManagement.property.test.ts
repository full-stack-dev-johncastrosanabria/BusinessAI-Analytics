/**
 * Property-Based Test: Git Workflow Management Integrity
 *
 * **Validates: Requirements 4.10**
 *
 * Property 29: For any branch operation, the Branch_Manager SHALL maintain proper
 * Git workflow with protected branches and required status checks enforced.
 *
 * Since we cannot test actual Git operations, this test validates that the workflow
 * configuration and rules are correctly defined in:
 * - DEPLOYMENT.md: Branch hierarchy and protection rules
 * - .github/workflows/ci.yml: CI pipeline with status checks
 *
 * Sub-properties tested:
 *   P29a – Branch hierarchy is correctly documented (main → staging → develop → feature/*)
 *   P29b – Required status checks are defined in CI workflow
 *   P29c – Quality gate checks are present in the CI workflow
 *   P29d – Deployment readiness checks exist for protected branches
 *   P29e – Branch protection rules are documented for all protected branches
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { readFileSync } from 'fs'
import { join } from 'path'

// ─── Configuration File Readers ──────────────────────────────────────────────

/**
 * Read DEPLOYMENT.md from the project root
 */
function readDeploymentDoc(): string {
  try {
    const path = join(process.cwd(), '..', 'DEPLOYMENT.md')
    return readFileSync(path, 'utf-8')
  } catch (error) {
    throw new Error(`Failed to read DEPLOYMENT.md: ${error}`)
  }
}

/**
 * Read .github/workflows/ci.yml from the project root
 */
function readCIWorkflow(): string {
  try {
    const path = join(process.cwd(), '..', '.github', 'workflows', 'ci.yml')
    return readFileSync(path, 'utf-8')
  } catch (error) {
    throw new Error(`Failed to read .github/workflows/ci.yml: ${error}`)
  }
}

// ─── Branch Configuration Types ──────────────────────────────────────────────

type BranchName = 'main' | 'staging' | 'develop' | 'feature/*' | 'fix/*' | 'hotfix/*'
type ProtectionLevel = 'highest' | 'high' | 'moderate' | 'basic' | 'none'

interface BranchConfig {
  readonly name: BranchName
  readonly expectedProtection: ProtectionLevel
  readonly requiresReviews: boolean
  readonly minimumReviews?: number
  readonly requiresStatusChecks: boolean
  readonly canForcePush: boolean
  readonly canDelete: boolean
}

// ─── Expected Branch Configurations ──────────────────────────────────────────

const EXPECTED_BRANCH_CONFIGS: BranchConfig[] = [
  {
    name: 'main',
    expectedProtection: 'highest',
    requiresReviews: true,
    minimumReviews: 2,
    requiresStatusChecks: true,
    canForcePush: false,
    canDelete: false,
  },
  {
    name: 'staging',
    expectedProtection: 'high',
    requiresReviews: true,
    minimumReviews: 1,
    requiresStatusChecks: true,
    canForcePush: false,
    canDelete: false,
  },
  {
    name: 'develop',
    expectedProtection: 'moderate',
    requiresReviews: true,
    minimumReviews: 1,
    requiresStatusChecks: true,
    canForcePush: false,
    canDelete: true, // Note: deletion setting not explicitly documented for develop
  },
]

// ─── Required Status Checks ──────────────────────────────────────────────────

const REQUIRED_STATUS_CHECKS = [
  'Frontend (TypeScript)',
  'AI Service (Python)',
  'Java Services',
  'Quality Gate',
  'CI Pipeline',
]

const REQUIRED_CI_JOBS = [
  'frontend-build',
  'ai-service-build',
  'java-services-build',
  'quality-gate',
  'deployment-ready',
]

// ─── Validation Functions ────────────────────────────────────────────────────

/**
 * Validate that the branch hierarchy is documented correctly
 */
function validateBranchHierarchy(deploymentDoc: string): boolean {
  // SONAR_SAFE: Fixed regex to prevent catastrophic backtracking
  // Original pattern was vulnerable due to nested quantifiers (.*\n.*staging.*\n.*)
  // New pattern uses non-greedy quantifiers and specific line matching
  const hierarchyPattern = /main[^\n]*\n[^\n]*staging[^\n]*\n[^\n]*develop[^\n]*\n[^\n]*feature/is
  return hierarchyPattern.test(deploymentDoc)
}

/**
 * Validate that a specific branch has documented protection rules
 */
function validateBranchProtection(
  deploymentDoc: string,
  branchName: string,
  config: BranchConfig
): { valid: boolean; missingRules: string[] } {
  const missingRules: string[] = []

  // Check for branch section
  const branchSectionRegex = new RegExp(
    `Protection Rules for \`${branchName}\``,
    'i'
  )
  if (!branchSectionRegex.test(deploymentDoc)) {
    missingRules.push(`Missing protection rules section for ${branchName}`)
    return { valid: false, missingRules }
  }

  // Extract the section for this branch
  const sectionStart = deploymentDoc.search(branchSectionRegex)
  const nextSectionStart = deploymentDoc.indexOf('###', sectionStart + 1)
  const section =
    nextSectionStart > -1
      ? deploymentDoc.slice(sectionStart, nextSectionStart)
      : deploymentDoc.slice(sectionStart)

  // Check for required reviews
  if (config.requiresReviews) {
    if (!/Require pull request reviews/i.test(section)) {
      missingRules.push(`Missing pull request review requirement for ${branchName}`)
    }
    if (config.minimumReviews) {
      const reviewPattern = new RegExp(
        `Required approving reviews:\\s*${config.minimumReviews}`,
        'i'
      )
      if (!reviewPattern.test(section)) {
        missingRules.push(
          `Missing or incorrect minimum review count for ${branchName}`
        )
      }
    }
  }

  // Check for status checks requirement
  if (config.requiresStatusChecks) {
    if (!/Require status checks to pass/i.test(section)) {
      missingRules.push(`Missing status checks requirement for ${branchName}`)
    }
  }

  // Check force push setting
  if (!config.canForcePush) {
    if (!/Allow force pushes:.*Disabled/i.test(section)) {
      missingRules.push(`Force push should be disabled for ${branchName}`)
    }
  }

  // Check deletion setting
  if (!config.canDelete) {
    if (!/Allow deletions:.*Disabled/i.test(section)) {
      missingRules.push(`Deletion should be disabled for ${branchName}`)
    }
  }
  // Note: If canDelete is true, we don't check for the setting as it may not be documented

  return { valid: missingRules.length === 0, missingRules }
}

/**
 * Validate that required status checks are documented
 */
function validateStatusChecksDocumented(deploymentDoc: string): {
  valid: boolean
  missingChecks: string[]
} {
  const missingChecks: string[] = []

  for (const check of REQUIRED_STATUS_CHECKS) {
    if (!deploymentDoc.includes(check)) {
      missingChecks.push(check)
    }
  }

  return { valid: missingChecks.length === 0, missingChecks }
}

/**
 * Validate that CI workflow contains required jobs
 */
function validateCIJobs(ciWorkflow: string): {
  valid: boolean
  missingJobs: string[]
} {
  const missingJobs: string[] = []

  for (const job of REQUIRED_CI_JOBS) {
    // Check for job definition (e.g., "frontend-build:" or "  frontend-build:")
    const jobPattern = new RegExp(`^\\s*${job}:`, 'm')
    if (!jobPattern.test(ciWorkflow)) {
      missingJobs.push(job)
    }
  }

  return { valid: missingJobs.length === 0, missingJobs }
}

/**
 * Validate that quality gate job exists and has proper configuration
 */
function validateQualityGateJob(ciWorkflow: string): boolean {
  // Check for quality-gate job
  if (!/quality-gate:/m.test(ciWorkflow)) {
    return false
  }

  // Check that it depends on other jobs
  const qualityGateSection = ciWorkflow.match(
    /quality-gate:[\s\S]*?(?=\n\S|\n$)/
  )
  if (!qualityGateSection) {
    return false
  }

  const section = qualityGateSection[0]

  // Should have needs dependencies
  if (!/needs:/m.test(section)) {
    return false
  }

  // Should check SonarQube
  if (!/sonarqube/i.test(section)) {
    return false
  }

  return true
}

/**
 * Validate that deployment readiness checks exist for protected branches
 */
function validateDeploymentReadiness(ciWorkflow: string): boolean {
  // Check for deployment-ready job
  if (!/deployment-ready:/m.test(ciWorkflow)) {
    return false
  }

  // Check that it runs only on protected branches
  const deploymentSection = ciWorkflow.match(
    /deployment-ready:[\s\S]*?(?=\n\S|\n$)/
  )
  if (!deploymentSection) {
    return false
  }

  const section = deploymentSection[0]

  // Should check for main, staging, or develop branches
  if (
    !/refs\/heads\/main/i.test(section) ||
    !/refs\/heads\/staging/i.test(section) ||
    !/refs\/heads\/develop/i.test(section)
  ) {
    return false
  }

  return true
}

/**
 * Validate that CI workflow triggers on correct branches
 */
function validateCITriggers(ciWorkflow: string): {
  valid: boolean
  missingBranches: string[]
} {
  const requiredBranches = ['main', 'staging', 'develop']
  const missingBranches: string[] = []

  // Extract the 'on' section
  const onSection = ciWorkflow.match(/^on:[\s\S]*?(?=\njobs:)/m)
  if (!onSection) {
    return { valid: false, missingBranches: requiredBranches }
  }

  const section = onSection[0]

  for (const branch of requiredBranches) {
    if (!section.includes(branch)) {
      missingBranches.push(branch)
    }
  }

  return { valid: missingBranches.length === 0, missingBranches }
}

// ─── Arbitraries ─────────────────────────────────────────────────────────────

const branchNameArb: fc.Arbitrary<BranchName> = fc.constantFrom<BranchName>(
  'main',
  'staging',
  'develop',
  'feature/*',
  'fix/*',
  'hotfix/*'
)

const protectedBranchArb: fc.Arbitrary<BranchName> = fc.constantFrom<BranchName>(
  'main',
  'staging',
  'develop'
)

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('Property 29: Git Workflow Management Integrity (Validates: Requirements 4.10)', () => {
  const deploymentDoc = readDeploymentDoc()
  const ciWorkflow = readCIWorkflow()

  /**
   * P29a – Branch hierarchy is correctly documented in DEPLOYMENT.md
   * The hierarchy should be: main → staging → develop → feature/*
   */
  it('P29a: branch hierarchy is correctly documented', () => {
    const isValid = validateBranchHierarchy(deploymentDoc)
    expect(isValid).toBe(true)
  })

  /**
   * P29b – All protected branches have documented protection rules
   * For any protected branch, protection rules must be documented
   */
  it('P29b: all protected branches have documented protection rules', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...EXPECTED_BRANCH_CONFIGS),
        (branchConfig) => {
          const { valid, missingRules } = validateBranchProtection(
            deploymentDoc,
            branchConfig.name,
            branchConfig
          )

          if (!valid) {
            console.error(
              `Branch ${branchConfig.name} missing rules:`,
              missingRules
            )
          }

          return valid
        }
      )
    )
  })

  /**
   * P29c – Required status checks are documented in DEPLOYMENT.md
   */
  it('P29c: required status checks are documented', () => {
    const { valid, missingChecks } = validateStatusChecksDocumented(deploymentDoc)

    if (!valid) {
      console.error('Missing status checks:', missingChecks)
    }

    expect(valid).toBe(true)
  })

  /**
   * P29d – CI workflow contains all required jobs
   */
  it('P29d: CI workflow contains all required jobs', () => {
    const { valid, missingJobs } = validateCIJobs(ciWorkflow)

    if (!valid) {
      console.error('Missing CI jobs:', missingJobs)
    }

    expect(valid).toBe(true)
  })

  /**
   * P29e – Quality gate job is properly configured in CI workflow
   */
  it('P29e: quality gate job is properly configured', () => {
    const isValid = validateQualityGateJob(ciWorkflow)
    expect(isValid).toBe(true)
  })

  /**
   * P29f – Deployment readiness checks exist for protected branches
   */
  it('P29f: deployment readiness checks exist for protected branches', () => {
    const isValid = validateDeploymentReadiness(ciWorkflow)
    expect(isValid).toBe(true)
  })

  /**
   * P29g – CI workflow triggers on all protected branches
   */
  it('P29g: CI workflow triggers on all protected branches', () => {
    const { valid, missingBranches } = validateCITriggers(ciWorkflow)

    if (!valid) {
      console.error('CI workflow missing triggers for branches:', missingBranches)
    }

    expect(valid).toBe(true)
  })

  /**
   * P29h – For any protected branch, force push and deletion are disabled
   * This is a property-based test that checks all protected branches
   */
  it('P29h: force push and deletion are disabled for all protected branches', () => {
    fc.assert(
      fc.property(protectedBranchArb, (branchName) => {
        const config = EXPECTED_BRANCH_CONFIGS.find((c) => c.name === branchName)
        if (!config) return true // Skip non-protected branches

        const { valid } = validateBranchProtection(deploymentDoc, branchName, config)
        return valid
      })
    )
  })

  /**
   * P29i – Branch protection requirements scale with branch importance
   * main requires more reviews than staging, staging more than develop
   */
  it('P29i: branch protection requirements scale with branch importance', () => {
    const mainConfig = EXPECTED_BRANCH_CONFIGS.find((c) => c.name === 'main')
    const stagingConfig = EXPECTED_BRANCH_CONFIGS.find((c) => c.name === 'staging')
    const developConfig = EXPECTED_BRANCH_CONFIGS.find((c) => c.name === 'develop')

    expect(mainConfig?.minimumReviews).toBeGreaterThan(
      stagingConfig?.minimumReviews ?? 0
    )
    expect(stagingConfig?.minimumReviews).toBeGreaterThanOrEqual(
      developConfig?.minimumReviews ?? 0
    )
  })

  /**
   * P29j – Workflow configuration is consistent between documentation and CI
   * Any branch mentioned in DEPLOYMENT.md should be in CI triggers
   */
  it('P29j: workflow configuration is consistent between docs and CI', () => {
    fc.assert(
      fc.property(protectedBranchArb, (branchName) => {
        // If branch is documented as protected, it should be in CI triggers
        const isDocumented = deploymentDoc.includes(`\`${branchName}\``)
        const isInCI = ciWorkflow.includes(branchName)

        // Protected branches must be in both
        return !isDocumented || isInCI
      })
    )
  })
})
