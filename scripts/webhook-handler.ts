#!/usr/bin/env ts-node
/**
 * Git Webhook Handler
 *
 * A lightweight Express HTTP server that receives GitHub push / pull-request
 * webhook events and triggers the appropriate SonarQube module analysis.
 *
 * Usage:
 *   npx ts-node scripts/webhook-handler.ts
 *
 * Environment variables:
 *   PORT                – HTTP port to listen on (default: 3001)
 *   WEBHOOK_SECRET      – GitHub webhook secret for HMAC-SHA256 signature validation
 *   SONAR_HOST_URL      – SonarQube server URL (default: http://localhost:9000)
 *   SONAR_TOKEN         – SonarQube authentication token
 *   ANALYSIS_PARALLEL   – Set to "true" to run module analysis in parallel
 */

import * as http from 'http';
import * as crypto from 'crypto';
import { orchestrateAnalysis, MODULES } from './sonarqube-orchestrator';

// ─── Configuration ────────────────────────────────────────────────────────────

const PORT = parseInt(process.env.PORT ?? '3001', 10);
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET ?? '';
const ANALYSIS_PARALLEL = process.env.ANALYSIS_PARALLEL === 'true';

// ─── Types ────────────────────────────────────────────────────────────────────

export type WebhookEventType = 'push' | 'pull_request' | 'unknown';

export interface WebhookPayload {
  ref?: string;           // push: "refs/heads/main"
  action?: string;        // pull_request: "opened" | "synchronize" | "reopened"
  repository?: {
    full_name: string;
  };
  pull_request?: {
    head: { ref: string };
    base: { ref: string };
  };
  commits?: Array<{
    added: string[];
    modified: string[];
    removed: string[];
  }>;
}

export interface WebhookHandlerResult {
  event: WebhookEventType;
  branch: string;
  modulesTriggered: string[];
  analysisStatus: 'triggered' | 'skipped' | 'error';
  message: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function log(level: 'INFO' | 'WARN' | 'ERROR', message: string): void {
  console.log(`[${new Date().toISOString()}] [${level}] ${message}`);
}

/**
 * Validates the GitHub webhook HMAC-SHA256 signature.
 * Returns true when the secret is not configured (development mode).
 */
export function validateSignature(body: string, signature: string | undefined): boolean {
  if (!WEBHOOK_SECRET) return true; // no secret configured → skip validation

  if (!signature) return false;

  const expected = `sha256=${crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(body, 'utf8')
    .digest('hex')}`;

  // Constant-time comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

/**
 * Determines which modules are affected by the changed file paths.
 * Falls back to all modules when no specific paths are provided.
 */
export function resolveAffectedModules(changedPaths: string[]): string[] {
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

  // If no module matched (e.g. root-level files), analyse all
  return affected.size > 0 ? Array.from(affected) : MODULES.map(m => m.name);
}

/**
 * Extracts the branch name from a push event ref string.
 * e.g. "refs/heads/main" → "main"
 */
export function extractBranch(ref: string): string {
  return ref.replace(/^refs\/heads\//, '');
}

/**
 * Collects all changed file paths from a push event's commits array.
 */
export function collectChangedPaths(payload: WebhookPayload): string[] {
  if (!payload.commits) return [];
  const paths: string[] = [];
  for (const commit of payload.commits) {
    paths.push(...commit.added, ...commit.modified, ...commit.removed);
  }
  return [...new Set(paths)];
}

// ─── Event handler ────────────────────────────────────────────────────────────

/**
 * Processes a parsed webhook payload and triggers analysis.
 * This function is exported for unit testing without needing an HTTP server.
 */
export async function handleWebhookEvent(
  eventType: string,
  payload: WebhookPayload,
): Promise<WebhookHandlerResult> {
  const event: WebhookEventType =
    eventType === 'push' ? 'push'
    : eventType === 'pull_request' ? 'pull_request'
    : 'unknown';

  // Determine branch
  let branch = 'unknown';
  if (event === 'push' && payload.ref) {
    branch = extractBranch(payload.ref);
  } else if (event === 'pull_request' && payload.pull_request) {
    branch = payload.pull_request.head.ref;
  }

  // Only analyse on relevant PR actions
  if (event === 'pull_request') {
    const action = payload.action ?? '';
    if (!['opened', 'synchronize', 'reopened'].includes(action)) {
      return {
        event,
        branch,
        modulesTriggered: [],
        analysisStatus: 'skipped',
        message: `PR action "${action}" does not trigger analysis`,
      };
    }
  }

  if (event === 'unknown') {
    return {
      event,
      branch,
      modulesTriggered: [],
      analysisStatus: 'skipped',
      message: 'Unrecognised event type — no analysis triggered',
    };
  }

  // Determine which modules to analyse
  const changedPaths = collectChangedPaths(payload);
  const modulesTriggered = resolveAffectedModules(changedPaths);

  log('INFO', `Event: ${event}, branch: ${branch}, modules: ${modulesTriggered.join(', ')}`);

  try {
    // Fire-and-forget: don't block the HTTP response waiting for analysis
    orchestrateAnalysis(modulesTriggered, ANALYSIS_PARALLEL).then(result => {
      log('INFO', `Analysis finished — overall: ${result.overallStatus}`);
    }).catch(err => {
      log('ERROR', `Analysis error: ${err instanceof Error ? err.message : String(err)}`);
    });

    return {
      event,
      branch,
      modulesTriggered,
      analysisStatus: 'triggered',
      message: `Analysis triggered for ${modulesTriggered.length} module(s)`,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log('ERROR', `Failed to trigger analysis: ${message}`);
    return {
      event,
      branch,
      modulesTriggered,
      analysisStatus: 'error',
      message,
    };
  }
}

// ─── HTTP server ──────────────────────────────────────────────────────────────

function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function sendJson(res: http.ServerResponse, statusCode: number, body: unknown): void {
  const json = JSON.stringify(body);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(json),
  });
  res.end(json);
}

export function createWebhookServer(): http.Server {
  return http.createServer(async (req, res) => {
    // Health check
    if (req.method === 'GET' && req.url === '/health') {
      sendJson(res, 200, { status: 'ok' });
      return;
    }

    // Only accept POST /webhook
    if (req.method !== 'POST' || req.url !== '/webhook') {
      sendJson(res, 404, { error: 'Not found' });
      return;
    }

    let body: string;
    try {
      body = await readBody(req);
    } catch {
      sendJson(res, 400, { error: 'Failed to read request body' });
      return;
    }

    // Validate signature
    const signature = req.headers['x-hub-signature-256'] as string | undefined;
    if (!validateSignature(body, signature)) {
      log('WARN', 'Webhook signature validation failed');
      sendJson(res, 401, { error: 'Invalid signature' });
      return;
    }

    // Parse payload
    let payload: WebhookPayload;
    try {
      payload = JSON.parse(body) as WebhookPayload;
    } catch {
      sendJson(res, 400, { error: 'Invalid JSON payload' });
      return;
    }

    const eventType = (req.headers['x-github-event'] as string) ?? 'unknown';
    log('INFO', `Received webhook event: ${eventType}`);

    const result = await handleWebhookEvent(eventType, payload);

    sendJson(res, 200, result);
  });
}

// ─── CLI entry point ──────────────────────────────────────────────────────────

if (require.main === module) {
  const server = createWebhookServer();
  server.listen(PORT, () => {
    log('INFO', `Webhook handler listening on port ${PORT}`);
    log('INFO', `POST http://localhost:${PORT}/webhook`);
    if (!WEBHOOK_SECRET) {
      log('WARN', 'WEBHOOK_SECRET is not set — signature validation is disabled');
    }
  });
}
