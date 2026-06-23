import { execFileSync, spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseGitHubRepository } from '../../scripts/ops/watch-pushed-deployment.mjs';

export function isGitPushCommand(command) {
  const normalized = String(command ?? '').trim();
  if (/^echo\s+["']?git push/.test(normalized)) {
    return false;
  }
  return /(^|[;&|]\s*)git\s+push(\s|$)/.test(normalized);
}

export function isSuccessfulBashHook(input) {
  if (input?.tool_name !== 'Bash') {
    return false;
  }

  const response = input.tool_response ?? {};
  const exitCode = response.exit_code ?? response.exitCode ?? response.statusCode;
  const status = String(response.status ?? '').toLowerCase();

  if (typeof exitCode === 'number' && exitCode !== 0) {
    return false;
  }

  if (status && !['success', 'completed', 'ok'].includes(status)) {
    return false;
  }

  return true;
}

export function shouldStartWatcher(input) {
  return isSuccessfulBashHook(input) && isGitPushCommand(input.tool_input?.command);
}

export function buildWatcherArgs({ repoRoot, branch, sha, repository }) {
  return [
    resolve(repoRoot, 'scripts/ops/watch-pushed-deployment.mjs'),
    '--branch',
    branch,
    '--sha',
    sha,
    '--repo',
    repository,
    '--log-file',
    resolve(repoRoot, '.codex/local/post-push-status.jsonl'),
  ];
}

async function readStdin() {
  let input = '';
  for await (const chunk of process.stdin) {
    input += chunk;
  }
  return input;
}

function readText(command, args, cwd) {
  return execFileSync(command, args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
}

function resolveContext(cwd) {
  const repoRoot = readText('git', ['rev-parse', '--show-toplevel'], cwd);
  const branch = readText('git', ['branch', '--show-current'], repoRoot);
  const sha = readText('git', ['rev-parse', 'HEAD'], repoRoot);
  const origin = readText('git', ['remote', 'get-url', 'origin'], repoRoot);
  const repository = parseGitHubRepository(origin);

  return { repoRoot, branch, sha, repository };
}

async function main() {
  const rawInput = await readStdin();
  const input = rawInput ? JSON.parse(rawInput) : {};

  if (!shouldStartWatcher(input)) {
    return 0;
  }

  const cwd = input.cwd || process.cwd();
  const context = resolveContext(cwd);

  if (!context.repository) {
    console.log(JSON.stringify({ systemMessage: 'Post-push watcher skipped: origin is not a GitHub repository.' }));
    return 0;
  }

  const args = buildWatcherArgs(context);
  mkdirSync(dirname(args[args.length - 1]), { recursive: true });

  const child = spawn(process.execPath, args, {
    cwd: context.repoRoot,
    detached: true,
    stdio: 'ignore',
  });
  child.unref();

  console.log(
    JSON.stringify({
      systemMessage: `Started post-push watcher for ${context.branch} ${context.sha.slice(0, 7)}.`,
    }),
  );
  return 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  process.exit(await main());
}
