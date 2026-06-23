import assert from 'node:assert/strict';
import { resolve } from 'node:path';

import {
  buildWatcherArgs,
  isGitPushCommand,
  isSuccessfulBashHook,
  shouldStartWatcher,
} from './post-git-push-check.mjs';

assert.equal(isGitPushCommand('git push'), true);
assert.equal(isGitPushCommand('git push origin codex/post-push-watch'), true);
assert.equal(isGitPushCommand('npm test && git push origin main'), true);
assert.equal(isGitPushCommand('git status'), false);
assert.equal(isGitPushCommand('echo "git push"'), false);

assert.equal(
  isSuccessfulBashHook({
    tool_name: 'Bash',
    tool_input: { command: 'git push origin main' },
    tool_response: { exit_code: 0 },
  }),
  true,
);

assert.equal(
  isSuccessfulBashHook({
    tool_name: 'Bash',
    tool_input: { command: 'git push origin main' },
    tool_response: { exit_code: 1 },
  }),
  false,
);

assert.equal(
  shouldStartWatcher({
    tool_name: 'Bash',
    tool_input: { command: 'git push origin codex/post-push-watch' },
    tool_response: { exitCode: 0 },
  }),
  true,
);

assert.equal(
  shouldStartWatcher({
    tool_name: 'Bash',
    tool_input: { command: 'git status' },
    tool_response: { exitCode: 0 },
  }),
  false,
);

assert.deepEqual(buildWatcherArgs({
  repoRoot: '/repo',
  branch: 'codex/post-push-watch',
  sha: 'abc123',
  repository: 'HuangJingwang/starry-summer',
}), [
  resolve('/repo', 'scripts/ops/watch-pushed-deployment.mjs'),
  '--branch',
  'codex/post-push-watch',
  '--sha',
  'abc123',
  '--repo',
  'HuangJingwang/starry-summer',
  '--log-file',
  resolve('/repo', '.codex/local/post-push-status.jsonl'),
]);

console.log('post git push hook tests passed');
