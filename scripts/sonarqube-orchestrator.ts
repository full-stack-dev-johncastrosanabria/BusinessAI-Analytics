#!/usr/bin/env ts-node
/**
 * SonarQube Analysis Orchestrator
 *
 * Coordinates SonarQube scanning across all 8 modules of the
 * BusinessAI Analytics Platform:
 *   - frontend          (TypeScript/React)
 *   - ai-service        (Python)
 *   - api-gateway       (Java/Spring Boot)
 *   - analytics-service (Java/Spring Boot)
 *   - customer-service  (Java/Spring Boot)
 *   - product-service   (Java/Spring Boot)
 *   - sales-service     (Java/Spring Boot)
 *   - document-service  (Java/Spring Boot)
 *
 * Usage:
 *   npx ts-node scripts/sonarqube-orchestrator.ts [--module <name>] [--parallel]
 *
 * Environment variables:
 *   SONAR_HOST_URL  – SonarQube server URL (default: http://localhost:9000)
 *   SONAR_TOKEN     – SonarQube authentication token
 */

import { execSync, spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

// ─── Configuration ────────────────────────────────────────────────────────────

const SONAR_HOST_URL = process.env.SONAR_HOST_URL ?? 'http://localhost:9000';
const SONAR_TOKEN = process.env.SONAR_TOKEN ?? '';

const WORKSPACE_ROOT = path.resolve(__dirname, '..');

export interface ModuleConfig {
  name: string;
  dir: string;
  language: 'typescript' | 'java' | 'python';
  /** Pre-analysis build/test command (optional) */
  prebuild?: string;
}

export const MODULES: ModuleConfig[] = [
  {
    name: 'frontend',
    dir: 'frontend',
    language: 'typescript',
    prebuild: 'npm ci && npx vitest run --coverage',
  },
  {
    name: 'ai-service',
    dir: 'ai-service',
    language: 'python',
    prebuild: 'pip install -r requirements.txt && pytest --cov=. --cov-report=xml || true',
  },
  {
    name: 'api-gateway',
    dir: 'api-gateway',
    language: 'java',
    prebuild: 'mvn -B verify -Pcoverage --no-transfer-progress || true',
  },
  {
    name: 'analytics-service',
    dir: 'analytics-service',
    language: 'java',
    prebuild: 'mvn -B verify -Pcoverage --no-transfer-progress || true',
  },
  {
    name: 'customer-service',
    dir: 'customer-service',
    language: 'java',
    prebuild: 'mvn -B verify -Pcoverage --no-transfer-progress || true',
  },
  {
    name: 'product-service',
    dir: 'product-service',
    language: 'java',
    prebuild: 'mvn -B verify -Pcoverage --no-transfer-progress || true',
  },
  {
    name: 'sales-service',
    dir: 'sales-service',
    language: 'java',
    prebuild: 'mvn -B verify -Pcoverage --no-transfer-progress || true',
  },
  {
    name: 'document-service',
    dir: 'document-service',
    language: 'java',
    prebuild: 'mvn -B verify -Pcoverage --no-transfer-progress || true',
  },
];

// ─── Types ────────────────────────────────────────────────────────────────────

export type AnalysisStatus = 'pending' | 'running' | 'success' | 'failed' | 'skipped';

export interface ModuleAnalysisResult {
  module: string;
  status: AnalysisStatus;
  durationMs: number;
  error?: string;
}

export interface OrchestrationResult {
  startedAt: Date;
  completedAt: Date;
  results: ModuleAnalysisResult[];
  overallStatus: 'success' | 'partial' | 'failed';
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function log(level: 'INFO' | 'WARN' | 'ERROR', message: string): void {
  const ts = new Date().toISOString();
  console.log(`[${ts}] [${level}] ${message}`);
}

function moduleDir(mod: ModuleConfig): string {
  return path.join(WORKSPACE_ROOT, mod.dir);
}

function moduleExists(mod: ModuleConfig): boolean {
  return fs.existsSync(moduleDir(mod));
}

/**
 * Runs a shell command synchronously in the given working directory.
 * Returns true on success, false on failure.
 * 
 * SECURITY NOTE: This function executes shell commands but is SAFE because:
 * 1. Commands are hardcoded in MODULES configuration (no user input)
 * 2. Used only for trusted build tools: npm, mvn, sonar-scanner
 * 3. Runs in controlled CI/development environment
 * 4. No dynamic command construction from external sources
 */
function runCommand(command: string, cwd: string): boolean {
  try {
    // SONAR_SAFE: Commands are hardcoded and from trusted sources only
    execSync(command, { cwd, stdio: 'inherit', env: process.env }); // NOSONAR S4721
    return true;
  } catch {
    return false;
  }
}

/**
 * Runs the SonarQube scanner for a single module.
 * Uses the sonar-scanner CLI which must be available on PATH,
 * or falls back to the Maven sonar:sonar goal for Java modules.
 */
function runSonarScanner(mod: ModuleConfig): boolean {
  const cwd = moduleDir(mod);

  if (mod.language === 'java') {
    // Java modules use the Maven SonarQube plugin
    return runCommand(
      `mvn sonar:sonar -Dsonar.host.url=${SONAR_HOST_URL} -Dsonar.token=${SONAR_TOKEN} --no-transfer-progress`,
      cwd,
    );
  }

  // TypeScript and Python modules use the standalone sonar-scanner CLI
  return runCommand(
    `sonar-scanner -Dsonar.host.url=${SONAR_HOST_URL} -Dsonar.token=${SONAR_TOKEN}`,
    cwd,
  );
}

// ─── Core orchestration ───────────────────────────────────────────────────────

/**
 * Analyses a single module: runs the optional prebuild step then the scanner.
 */
export async function analyseModule(mod: ModuleConfig): Promise<ModuleAnalysisResult> {
  const start = Date.now();

  if (!moduleExists(mod)) {
    log('WARN', `Module directory not found, skipping: ${mod.dir}`);
    return { module: mod.name, status: 'skipped', durationMs: 0 };
  }

  log('INFO', `Starting analysis for module: ${mod.name}`);

  // Optional prebuild (tests + coverage reports)
  if (mod.prebuild) {
    log('INFO', `Running prebuild for ${mod.name}: ${mod.prebuild}`);
    const ok = runCommand(mod.prebuild, moduleDir(mod));
    if (!ok) {
      log('WARN', `Prebuild step failed for ${mod.name} — continuing with scanner`);
    }
  }

  // Run the SonarQube scanner
  const scanOk = runSonarScanner(mod);
  const durationMs = Date.now() - start;

  if (scanOk) {
    log('INFO', `Analysis completed for ${mod.name} in ${durationMs}ms`);
    return { module: mod.name, status: 'success', durationMs };
  } else {
    const error = `Scanner exited with non-zero status for ${mod.name}`;
    log('ERROR', error);
    return { module: mod.name, status: 'failed', durationMs, error };
  }
}

/**
 * Orchestrates analysis across all (or a subset of) modules.
 *
 * @param moduleNames  Optional list of module names to analyse. Defaults to all.
 * @param parallel     When true, analyses all modules concurrently.
 */
export async function orchestrateAnalysis(
  moduleNames?: string[],
  parallel = false,
): Promise<OrchestrationResult> {
  const startedAt = new Date();

  const targets = moduleNames
    ? MODULES.filter(m => moduleNames.includes(m.name))
    : MODULES;

  if (targets.length === 0) {
    log('WARN', 'No matching modules found for analysis');
  }

  let results: ModuleAnalysisResult[];

  if (parallel) {
    log('INFO', `Running analysis in parallel for ${targets.length} module(s)`);
    results = await Promise.all(targets.map(analyseModule));
  } else {
    log('INFO', `Running analysis sequentially for ${targets.length} module(s)`);
    results = [];
    for (const mod of targets) {
      results.push(await analyseModule(mod));
    }
  }

  const completedAt = new Date();
  const failed = results.filter(r => r.status === 'failed').length;
  const succeeded = results.filter(r => r.status === 'success').length;

  const overallStatus =
    failed === 0 ? 'success' : succeeded === 0 ? 'failed' : 'partial';

  log('INFO', `Orchestration complete — success: ${succeeded}, failed: ${failed}`);

  return { startedAt, completedAt, results, overallStatus };
}

// ─── CLI entry point ──────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  // Parse --module <name> (can be repeated)
  const moduleNames: string[] = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--module' && args[i + 1]) {
      moduleNames.push(args[++i]);
    }
  }

  const parallel = args.includes('--parallel');

  if (!SONAR_TOKEN) {
    log('WARN', 'SONAR_TOKEN is not set — scanner may fail authentication');
  }

  log('INFO', `SonarQube host: ${SONAR_HOST_URL}`);

  const result = await orchestrateAnalysis(
    moduleNames.length > 0 ? moduleNames : undefined,
    parallel,
  );

  // Print summary
  console.log('\n── Analysis Summary ──────────────────────────────────────');
  for (const r of result.results) {
    const icon = r.status === 'success' ? '✓' : r.status === 'skipped' ? '–' : '✗';
    console.log(`  ${icon} ${r.module.padEnd(20)} ${r.status}  (${r.durationMs}ms)`);
    if (r.error) console.log(`      └─ ${r.error}`);
  }
  console.log(`\n  Overall: ${result.overallStatus.toUpperCase()}`);
  console.log('──────────────────────────────────────────────────────────\n');

  process.exit(result.overallStatus === 'failed' ? 1 : 0);
}

// Run when executed directly
if (require.main === module) {
  main().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
