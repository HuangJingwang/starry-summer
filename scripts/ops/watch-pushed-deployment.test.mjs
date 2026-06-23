import assert from 'node:assert/strict';

import {
  buildStatusSummary,
  createStatusRecord,
  getVercelChecks,
  isTerminalSummary,
  parseGitHubRepository,
} from './watch-pushed-deployment.mjs';

const pendingSummary = buildStatusSummary({
  branch: 'codex/post-push-watch',
  sha: 'abc1234',
  pullRequest: {
    number: 12,
    title: 'feat: post push watch',
    url: 'https://github.com/HuangJingwang/starry-summer/pull/12',
    mergeStateStatus: 'CLEAN',
    isDraft: false,
  },
  checks: [
    { name: 'CI / Verify', status: 'COMPLETED', conclusion: 'SUCCESS' },
    { name: 'Vercel - starry-summer-web', status: 'IN_PROGRESS', conclusion: null },
  ],
});

assert.equal(pendingSummary.state, 'pending');
assert.equal(pendingSummary.pullRequest.number, 12);
assert.deepEqual(
  pendingSummary.vercelChecks.map((check) => `${check.name}:${check.state}`),
  ['Vercel - starry-summer-web:pending'],
);
assert.equal(isTerminalSummary(pendingSummary), false);

const failedSummary = buildStatusSummary({
  branch: 'codex/post-push-watch',
  sha: 'def5678',
  pullRequest: {
    number: 13,
    title: 'fix: deployment',
    url: 'https://github.com/HuangJingwang/starry-summer/pull/13',
    mergeStateStatus: 'CLEAN',
    isDraft: false,
  },
  checks: [
    { name: 'CI / Verify', status: 'COMPLETED', conclusion: 'SUCCESS' },
    { context: 'Vercel - starry-summer-web', state: 'FAILURE' },
  ],
});

assert.equal(failedSummary.state, 'failure');
assert.deepEqual(failedSummary.blockers, ['failing checks: Vercel - starry-summer-web']);
assert.equal(isTerminalSummary(failedSummary), true);

const productionSummary = buildStatusSummary({
  branch: 'main',
  sha: '9999999',
  pullRequest: null,
  checks: [{ name: 'Vercel - starry-summer-web', status: 'COMPLETED', conclusion: 'SUCCESS' }],
  productionSmoke: { ok: true, message: 'Production smoke passed for https://www.asterh.me' },
});

assert.equal(productionSummary.state, 'success');
assert.equal(productionSummary.productionSmoke.ok, true);
assert.equal(isTerminalSummary(productionSummary), true);

assert.deepEqual(
  getVercelChecks([
    { name: 'CI / Verify', status: 'COMPLETED', conclusion: 'SUCCESS' },
    { name: 'Vercel Preview Comments', status: 'COMPLETED', conclusion: 'SUCCESS' },
    { context: 'Vercel - starry-summer-web', state: 'SUCCESS' },
  ]).map((check) => check.name),
  ['Vercel Preview Comments', 'Vercel - starry-summer-web'],
);

assert.equal(parseGitHubRepository('git@github.com:HuangJingwang/starry-summer.git'), 'HuangJingwang/starry-summer');
assert.equal(parseGitHubRepository('https://github.com/HuangJingwang/starry-summer.git'), 'HuangJingwang/starry-summer');

const record = createStatusRecord(productionSummary);
assert.equal(record.kind, 'post-push-deployment-status');
assert.equal(record.branch, 'main');
assert.equal(record.state, 'success');
assert.ok(record.createdAt);

console.log('watch pushed deployment tests passed');
