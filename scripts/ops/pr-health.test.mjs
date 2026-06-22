import assert from 'node:assert/strict';

import { summarizePrHealth } from './pr-health.mjs';

const ready = summarizePrHealth({
  number: 7,
  title: 'refactor: public layout',
  url: 'https://github.com/Aster-H/starry-summer/pull/7',
  isDraft: false,
  headRefName: 'codex/refactor-public-layout',
  baseRefName: 'main',
  mergeStateStatus: 'CLEAN',
  reviewDecision: 'APPROVED',
  statusCheckRollup: [
    { name: 'test', conclusion: 'SUCCESS', status: 'COMPLETED' },
    { name: 'build', conclusion: 'SUCCESS', status: 'COMPLETED' },
  ],
});

assert.equal(ready.canAutoMerge, true);
assert.deepEqual(ready.blockers, []);
assert.deepEqual(ready.checks.map((check) => check.name), ['test', 'build']);

const conflicted = summarizePrHealth({
  number: 8,
  title: 'fix: old branch',
  url: 'https://github.com/Aster-H/starry-summer/pull/8',
  isDraft: false,
  headRefName: 'codex/old-branch',
  baseRefName: 'main',
  mergeStateStatus: 'DIRTY',
  reviewDecision: 'REVIEW_REQUIRED',
  statusCheckRollup: [{ name: 'test', conclusion: 'SUCCESS', status: 'COMPLETED' }],
});

assert.equal(conflicted.canAutoMerge, false);
assert.deepEqual(conflicted.blockers, ['merge conflicts require conflict resolution']);

const failing = summarizePrHealth({
  number: 9,
  title: 'feat: risky change',
  url: 'https://github.com/Aster-H/starry-summer/pull/9',
  isDraft: false,
  headRefName: 'codex/risky-change',
  baseRefName: 'main',
  mergeStateStatus: 'CLEAN',
  reviewDecision: 'APPROVED',
  statusCheckRollup: [
    { name: 'test', conclusion: 'FAILURE', status: 'COMPLETED' },
    { name: 'vercel', conclusion: null, status: 'IN_PROGRESS' },
  ],
});

assert.equal(failing.canAutoMerge, false);
assert.deepEqual(failing.blockers, ['failing checks: test', 'pending checks: vercel']);

const statusContextSuccess = summarizePrHealth({
  number: 10,
  title: 'fix: status context state',
  url: 'https://github.com/Aster-H/starry-summer/pull/10',
  isDraft: false,
  headRefName: 'codex/status-context',
  baseRefName: 'main',
  mergeStateStatus: 'UNSTABLE',
  reviewDecision: '',
  statusCheckRollup: [
    { context: 'Vercel – starry-summer-web-22ae', state: 'SUCCESS' },
    { name: 'Vercel Preview Comments', conclusion: 'SUCCESS', status: 'COMPLETED' },
  ],
});

assert.equal(statusContextSuccess.canAutoMerge, true);
assert.deepEqual(statusContextSuccess.checks.map((check) => check.state), ['success', 'success']);

const selfCheckIgnored = summarizePrHealth(
  {
    number: 11,
    title: 'ci: wire pr health',
    url: 'https://github.com/Aster-H/starry-summer/pull/10',
    isDraft: false,
    headRefName: 'codex/pr-health-action',
    baseRefName: 'main',
    mergeStateStatus: 'CLEAN',
    reviewDecision: 'APPROVED',
    statusCheckRollup: [
      { name: 'Verify', conclusion: 'SUCCESS', status: 'COMPLETED' },
      { name: 'PR Health', conclusion: null, status: 'IN_PROGRESS' },
    ],
  },
  { ignoredCheckNames: ['PR Health'] },
);

assert.equal(selfCheckIgnored.canAutoMerge, true);
assert.deepEqual(selfCheckIgnored.checks.map((check) => check.name), ['Verify']);

console.log('pr health tests passed');
