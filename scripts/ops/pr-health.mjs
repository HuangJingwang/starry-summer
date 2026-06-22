import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const prJsonFields = [
  'number',
  'title',
  'url',
  'isDraft',
  'headRefName',
  'baseRefName',
  'mergeStateStatus',
  'reviewDecision',
  'statusCheckRollup',
];

const failureConclusions = new Set(['ACTION_REQUIRED', 'CANCELLED', 'FAILURE', 'SKIPPED', 'STARTUP_FAILURE', 'TIMED_OUT']);
const successConclusions = new Set(['SUCCESS', 'NEUTRAL']);
const failureStatuses = new Set(['ERROR', 'FAILURE']);
const successStatuses = new Set(['SUCCESS']);
const pendingStatuses = new Set(['EXPECTED', 'IN_PROGRESS', 'PENDING', 'QUEUED', 'REQUESTED', 'WAITING']);

export function summarizePrHealth(pr, options = {}) {
  const ignoredCheckNames = new Set(options.ignoredCheckNames ?? []);
  const checks = normalizeStatusChecks(pr.statusCheckRollup ?? []).filter((check) => !ignoredCheckNames.has(check.name));
  const failingChecks = checks.filter((check) => check.state === 'failure');
  const pendingChecks = checks.filter((check) => check.state === 'pending');
  const blockers = [];

  if (pr.isDraft) {
    blockers.push('pull request is draft');
  }

  if (['DIRTY', 'CONFLICTING'].includes(pr.mergeStateStatus)) {
    blockers.push('merge conflicts require conflict resolution');
  }

  if (failingChecks.length > 0) {
    blockers.push(`failing checks: ${failingChecks.map((check) => check.name).join(', ')}`);
  }

  if (pendingChecks.length > 0) {
    blockers.push(`pending checks: ${pendingChecks.map((check) => check.name).join(', ')}`);
  }

  return {
    number: pr.number,
    title: pr.title,
    url: pr.url,
    headRefName: pr.headRefName,
    baseRefName: pr.baseRefName,
    mergeStateStatus: pr.mergeStateStatus,
    reviewDecision: pr.reviewDecision,
    checks,
    blockers,
    canAutoMerge: blockers.length === 0,
  };
}

function normalizeStatusChecks(checks) {
  return checks.map((check, index) => {
    const name = check.name ?? check.context ?? check.workflowName ?? check.__typename ?? `check-${index + 1}`;
    const conclusion = String(check.conclusion ?? '').toUpperCase();
    const status = String(check.status ?? check.state ?? '').toUpperCase();

    return {
      name,
      conclusion: conclusion || null,
      status: status || null,
      state: getCheckState({ conclusion, status }),
    };
  });
}

function getCheckState({ conclusion, status }) {
  if (failureConclusions.has(conclusion) || failureStatuses.has(status)) {
    return 'failure';
  }

  if (successConclusions.has(conclusion) || successStatuses.has(status)) {
    return 'success';
  }

  if (pendingStatuses.has(status) || !conclusion) {
    return 'pending';
  }

  return 'failure';
}

function readPrWithGh(prNumber) {
  const output = execFileSync('gh', ['pr', 'view', String(prNumber), '--json', prJsonFields.join(',')], {
    encoding: 'utf8',
  });

  return JSON.parse(output);
}

function parseArgs(argv) {
  const args = {
    pr: '',
    format: 'text',
    ignoredCheckNames: [],
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--pr') {
      args.pr = argv[index + 1] ?? '';
      index += 1;
    } else if (arg === '--format') {
      args.format = argv[index + 1] ?? args.format;
      index += 1;
    } else if (arg === '--ignore-check') {
      args.ignoredCheckNames.push(argv[index + 1] ?? '');
      index += 1;
    }
  }

  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!args.pr) {
    console.error('Usage: npm run ops:pr-health -- --pr <number> [--format json] [--ignore-check <name>]');
    return 1;
  }

  const summary = summarizePrHealth(readPrWithGh(args.pr), {
    ignoredCheckNames: args.ignoredCheckNames.filter(Boolean),
  });

  if (args.format === 'json') {
    console.log(JSON.stringify(summary, null, 2));
  } else {
    console.log(`PR #${summary.number}: ${summary.title}`);
    console.log(`Branch: ${summary.headRefName} -> ${summary.baseRefName}`);
    console.log(`Merge state: ${summary.mergeStateStatus}`);
    console.log(`Auto merge: ${summary.canAutoMerge ? 'ready' : 'blocked'}`);

    for (const blocker of summary.blockers) {
      console.log(`- ${blocker}`);
    }
  }

  return summary.canAutoMerge ? 0 : 2;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  process.exit(await main());
}
