import { execFileSync } from 'node:child_process';
import { mkdirSync, appendFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const successConclusions = new Set(['SUCCESS', 'NEUTRAL']);
const failureConclusions = new Set(['ACTION_REQUIRED', 'CANCELLED', 'FAILURE', 'SKIPPED', 'STARTUP_FAILURE', 'TIMED_OUT']);
const pendingStatuses = new Set(['EXPECTED', 'IN_PROGRESS', 'PENDING', 'QUEUED', 'REQUESTED', 'WAITING']);
const successStates = new Set(['SUCCESS']);
const failureStates = new Set(['ERROR', 'FAILURE']);

export function parseGitHubRepository(remoteUrl) {
  const trimmed = String(remoteUrl ?? '').trim();
  const sshMatch = trimmed.match(/^git@github\.com:([^/]+\/[^/]+?)(?:\.git)?$/);
  const httpsMatch = trimmed.match(/^https:\/\/github\.com\/([^/]+\/[^/]+?)(?:\.git)?$/);
  return (sshMatch?.[1] ?? httpsMatch?.[1] ?? '').replace(/\.git$/, '');
}

export function normalizeCheck(check, index = 0) {
  const name = check.name ?? check.context ?? check.workflowName ?? check.__typename ?? `check-${index + 1}`;
  const conclusion = String(check.conclusion ?? '').toUpperCase();
  const status = String(check.status ?? check.state ?? '').toUpperCase();

  return {
    name,
    conclusion: conclusion || null,
    status: status || null,
    state: getCheckState({ conclusion, status }),
    url: check.detailsUrl ?? check.details_url ?? check.target_url ?? check.url ?? null,
  };
}

export function getVercelChecks(checks) {
  return checks.map(normalizeCheck).filter((check) => /vercel/i.test(check.name));
}

export function buildStatusSummary({ branch, sha, pullRequest = null, checks = [], productionSmoke = null }) {
  const normalizedChecks = checks.map(normalizeCheck);
  const failingChecks = normalizedChecks.filter((check) => check.state === 'failure');
  const pendingChecks = normalizedChecks.filter((check) => check.state === 'pending');
  const blockers = [];

  if (pullRequest?.isDraft) {
    blockers.push('pull request is draft');
  }

  if (['DIRTY', 'CONFLICTING'].includes(pullRequest?.mergeStateStatus)) {
    blockers.push('merge conflicts require conflict resolution');
  }

  if (failingChecks.length > 0) {
    blockers.push(`failing checks: ${failingChecks.map((check) => check.name).join(', ')}`);
  }

  if (productionSmoke && !productionSmoke.ok) {
    blockers.push(`production smoke failed: ${productionSmoke.message}`);
  }

  let state = 'success';
  if (blockers.length > 0) {
    state = 'failure';
  } else if (pendingChecks.length > 0 || normalizedChecks.length === 0) {
    state = 'pending';
  }

  return {
    branch,
    sha,
    state,
    pullRequest,
    checks: normalizedChecks,
    vercelChecks: getVercelChecks(checks),
    productionSmoke,
    blockers,
  };
}

export function isTerminalSummary(summary) {
  return summary.state === 'success' || summary.state === 'failure';
}

export function createStatusRecord(summary) {
  return {
    kind: 'post-push-deployment-status',
    createdAt: new Date().toISOString(),
    branch: summary.branch,
    sha: summary.sha,
    state: summary.state,
    pullRequest: summary.pullRequest
      ? {
          number: summary.pullRequest.number,
          title: summary.pullRequest.title,
          url: summary.pullRequest.url,
          mergeStateStatus: summary.pullRequest.mergeStateStatus,
        }
      : null,
    vercelChecks: summary.vercelChecks,
    productionSmoke: summary.productionSmoke,
    blockers: summary.blockers,
  };
}

function getCheckState({ conclusion, status }) {
  if (failureConclusions.has(conclusion) || failureStates.has(status)) {
    return 'failure';
  }

  if (successConclusions.has(conclusion) || successStates.has(status)) {
    return 'success';
  }

  if (pendingStatuses.has(status) || !conclusion) {
    return 'pending';
  }

  return 'failure';
}

function readJsonCommand(command, args) {
  const output = execFileSync(command, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  return output ? JSON.parse(output) : null;
}

function readTextCommand(command, args) {
  return execFileSync(command, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function readPullRequest(branch) {
  const prs = readJsonCommand('gh', [
    'pr',
    'list',
    '--head',
    branch,
    '--json',
    'number,title,url,isDraft,headRefName,baseRefName,mergeStateStatus,reviewDecision,statusCheckRollup',
    '--limit',
    '1',
  ]);

  return Array.isArray(prs) ? (prs[0] ?? null) : null;
}

function readCommitChecks(repository, sha) {
  const checkRuns = readJsonCommand('gh', ['api', `repos/${repository}/commits/${sha}/check-runs`, '--jq', '.check_runs']) ?? [];
  const statuses = readJsonCommand('gh', ['api', `repos/${repository}/commits/${sha}/status`, '--jq', '.statuses']) ?? [];
  return [...checkRuns, ...statuses];
}

function runProductionSmoke(baseUrl) {
  try {
    const output = readTextCommand('npm', ['run', 'ops:production-smoke', '--', '--base-url', baseUrl]);
    return { ok: true, message: output.split('\n')[0] ?? `Production smoke passed for ${baseUrl}` };
  } catch (error) {
    const stderr = error?.stderr?.toString?.() ?? '';
    const stdout = error?.stdout?.toString?.() ?? '';
    return { ok: false, message: (stderr || stdout || error.message || 'unknown failure').trim().split('\n')[0] };
  }
}

function appendRecord(logFile, summary) {
  mkdirSync(dirname(logFile), { recursive: true });
  appendFileSync(logFile, `${JSON.stringify(createStatusRecord(summary))}\n`);
}

function notify(summary) {
  if (process.platform !== 'darwin') {
    return;
  }

  const title = summary.state === 'success' ? 'Starry Summer deployment ready' : 'Starry Summer deployment needs attention';
  const message = summary.blockers.length > 0 ? summary.blockers.join('; ') : `${summary.branch} ${summary.sha.slice(0, 7)} is healthy`;

  try {
    execFileSync('osascript', ['-e', `display notification ${JSON.stringify(message)} with title ${JSON.stringify(title)}`], {
      stdio: 'ignore',
    });
  } catch {
    // Notifications are best-effort; the JSONL log remains authoritative.
  }
}

function parseArgs(argv) {
  const args = {
    branch: '',
    sha: '',
    repo: '',
    logFile: resolve('.codex/local/post-push-status.jsonl'),
    baseUrl: 'https://www.asterh.me',
    pollIntervalMs: 30_000,
    timeoutMs: 20 * 60_000,
    once: false,
    notify: true,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--branch') {
      args.branch = argv[++index] ?? '';
    } else if (arg === '--sha') {
      args.sha = argv[++index] ?? '';
    } else if (arg === '--repo') {
      args.repo = argv[++index] ?? '';
    } else if (arg === '--log-file') {
      args.logFile = argv[++index] ?? args.logFile;
    } else if (arg === '--base-url') {
      args.baseUrl = argv[++index] ?? args.baseUrl;
    } else if (arg === '--poll-interval-ms') {
      args.pollIntervalMs = Number(argv[++index] ?? args.pollIntervalMs);
    } else if (arg === '--timeout-ms') {
      args.timeoutMs = Number(argv[++index] ?? args.timeoutMs);
    } else if (arg === '--once') {
      args.once = true;
    } else if (arg === '--no-notify') {
      args.notify = false;
    }
  }

  return args;
}

async function sleep(ms) {
  await new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!args.branch || !args.sha || !args.repo) {
    console.error('Usage: node scripts/ops/watch-pushed-deployment.mjs --branch <branch> --sha <sha> --repo <owner/repo>');
    return 1;
  }

  const startedAt = Date.now();
  let lastSummary = null;

  while (Date.now() - startedAt <= args.timeoutMs) {
    const pullRequest = readPullRequest(args.branch);
    const checks = pullRequest?.statusCheckRollup?.length ? pullRequest.statusCheckRollup : readCommitChecks(args.repo, args.sha);
    let summary = buildStatusSummary({ branch: args.branch, sha: args.sha, pullRequest, checks });

    if (args.branch === 'main' && summary.state === 'success') {
      summary = buildStatusSummary({
        branch: args.branch,
        sha: args.sha,
        pullRequest,
        checks,
        productionSmoke: runProductionSmoke(args.baseUrl),
      });
    }

    lastSummary = summary;

    if (isTerminalSummary(summary) || args.once) {
      appendRecord(args.logFile, summary);
      if (args.notify) {
        notify(summary);
      }
      console.log(JSON.stringify(createStatusRecord(summary), null, 2));
      return summary.state === 'failure' ? 2 : 0;
    }

    await sleep(args.pollIntervalMs);
  }

  const timedOut = {
    ...(lastSummary ?? buildStatusSummary({ branch: args.branch, sha: args.sha, checks: [] })),
    state: 'pending',
    blockers: ['timed out waiting for GitHub checks or Vercel deployment status'],
  };
  appendRecord(args.logFile, timedOut);
  console.log(JSON.stringify(createStatusRecord(timedOut), null, 2));
  return 3;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  process.exit(await main());
}
