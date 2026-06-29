import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const requiredFiles = ['LICENSE', 'CONTRIBUTING.md', 'SECURITY.md'];
const requiredOpsFiles = [
  '.github/workflows/ci.yml',
  '.github/workflows/leetcode-sync.yml',
  '.github/workflows/production-smoke.yml',
  'docs/ops/automation-runbook.md',
  'docs/ops/vercel-projects.md',
  'scripts/ops/production-smoke.mjs',
  'scripts/ops/pr-health.mjs',
  'scripts/ops/public-identity-guard.mjs',
];
const requiredSkillFiles = ['.codex/skills/starry-summer-public-theme-review/SKILL.md'];
const requiredPublicBrandFiles = ['apps/web/src/app/icon.svg'];
const removedDockerDeploymentFiles = [
  '.dockerignore',
  'docker-compose.yml',
  'apps/web/Dockerfile',
  'apps/api/Dockerfile',
  'packages/database/Dockerfile',
  'infra/caddy/Caddyfile',
  'scripts/docker-preflight.sh',
  'scripts/docker-preflight.test.sh',
  'scripts/dockerfile.test.sh',
];

console.log('Running repository hygiene tests');

for (const file of requiredFiles) {
  if (!existsSync(file)) {
    fail(`Expected repository file is missing: ${file}`);
  }
}

for (const file of requiredOpsFiles) {
  if (!existsSync(file)) {
    fail(`Expected ops automation file is missing: ${file}`);
  }
}

for (const file of requiredSkillFiles) {
  if (!existsSync(file)) {
    fail(`Expected Codex skill is missing: ${file}`);
  }
}

for (const file of requiredPublicBrandFiles) {
  if (!existsSync(file)) {
    fail(`Expected public brand asset is missing: ${file}`);
  }
}

for (const file of removedDockerDeploymentFiles) {
  if (existsSync(file)) {
    fail(`Docker self-hosting artifact should not be part of the default repository path: ${file}`);
  }
}

const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
const missing = [];

if (packageJson.license !== 'MIT') missing.push('license');
if (!packageJson.repository?.url) missing.push('repository.url');
if (!packageJson.bugs?.url) missing.push('bugs.url');
if (!packageJson.homepage) missing.push('homepage');

if (missing.length > 0) {
  fail(`package.json is missing open-source metadata: ${missing.join(', ')}`);
}

const packageLock = readFileSync('package-lock.json', 'utf8');

if (packageLock.includes('npm.runtongqiuben.com')) {
  fail('package-lock.json must not reference a private npm registry mirror.');
}

for (const scriptName of ['ops:docker-preflight', 'ops:deploy']) {
  if (scriptName in (packageJson.scripts ?? {})) {
    fail(`package.json must not expose ${scriptName}; default deployment is Vercel-managed.`);
  }
}

const envExample = readFileSync('.env.example', 'utf8');

if (/^[A-Z_]*(SECRET|TOKEN|PASSWORD|KEY|HASH)=scrypt:/m.test(envExample)) {
  fail('.env.example contains a generated secret or password hash.');
}

if (/^[A-Z_]*EMAIL=[0-9]{7,}$/m.test(envExample)) {
  fail('.env.example contains a numeric account identifier where a placeholder email is expected.');
}

for (const removedVariable of ['DOMAIN', 'ACME_EMAIL']) {
  if (new RegExp(`^${removedVariable}=`, 'm').test(envExample)) {
    fail(`.env.example must not document ${removedVariable}; Caddy/Docker deployment has been removed.`);
  }
}

for (const removedVariable of [
  'ADMIN_EMAIL',
  'ADMIN_PASSWORD_HASH',
  'SESSION_SECRET',
  'GITHUB_CONTENT_OWNER',
  'GITHUB_CONTENT_REPO',
  'GITHUB_CONTENT_BRANCH',
  'GITHUB_CONTENT_TOKEN',
  'REPOSITORY_PUBLISH_SECRET',
]) {
  if (new RegExp(`^${removedVariable}=`, 'm').test(envExample)) {
    fail(`.env.example must not document removed online admin or repository publishing variable ${removedVariable}.`);
  }
}

const trackedFiles = execFileSync('git', ['ls-files'], { encoding: 'utf8' })
  .split(/\r?\n/)
  .filter(Boolean);
const generatedSecretFixtureFiles = new Set(['scripts/doctor.test.sh']);

for (const file of trackedFiles) {
  if (!existsSync(file)) {
    continue;
  }

  const source = readFileSync(file, 'utf8');

  if (/(ADMIN_EMAIL|DEFAULT_ADMIN_ACCOUNT|placeholder=|Admin login account:|admin account).*['":= -][0-9]{7,}/.test(source)) {
    fail(`Tracked file contains a numeric admin account identifier: ${file}`);
  }

  if (
    !generatedSecretFixtureFiles.has(file) &&
    /(ADMIN_PASSWORD_HASH|DEFAULT_ADMIN_PASSWORD_HASH).*scrypt:[0-9]+:[0-9]+:[0-9]+:[0-9a-f]{16,}:[0-9a-f]{32,}/.test(source)
  ) {
    fail(`Tracked file contains a generated admin password hash: ${file}`);
  }
}

if (existsSync('.github/workflows/ci.yml')) {
  const ci = readFileSync('.github/workflows/ci.yml', 'utf8');

  for (const command of ['npm test', 'npm run typecheck', 'npm run build']) {
    if (!ci.includes(command)) {
      fail(`CI workflow must run ${command}.`);
    }
  }

  if (!ci.includes('npm run ops:pr-health -- --pr ${{ github.event.pull_request.number }}')) {
    fail('CI workflow must run the shared PR health gate for pull requests.');
  }

  if (!ci.includes("if: github.event_name == 'pull_request'")) {
    fail('CI workflow must limit the PR health gate to pull request events.');
  }

  if (!ci.includes('GH_TOKEN: ${{ github.token }}')) {
    fail('CI workflow must provide the GitHub token to gh for PR health checks.');
  }

  if (ci.includes("--ignore-check 'Vercel – starry-summer-web'")) {
    fail('CI workflow must not ignore the removed legacy Vercel project check.');
  }

  if (!ci.includes("startsWith(github.head_ref, 'codex/')")) {
    fail('CI workflow must limit auto-merge to Codex-managed pull request branches.');
  }

  if (!ci.includes('gh pr merge ${{ github.event.pull_request.number }}')) {
    fail('CI workflow must request GitHub auto-merge for healthy Codex pull requests.');
  }

  if (!ci.includes('--match-head-commit ${{ github.event.pull_request.head.sha }}')) {
    fail('CI auto-merge must pin the checked pull request head commit.');
  }

  if (ci.includes('docker compose')) {
    fail('CI workflow must not validate Docker Compose after removing the Docker deployment path.');
  }
}

const productionSmokeWorkflow = readFileSync('.github/workflows/production-smoke.yml', 'utf8');

if (!productionSmokeWorkflow.includes('npm run ops:production-smoke -- --base-url https://www.asterh.me')) {
  fail('Production smoke workflow must check https://www.asterh.me with the shared ops script.');
}

for (const dispatchType of ['vercel.deployment.success', 'vercel.deployment.error', 'vercel.deployment.failed']) {
  if (!productionSmokeWorkflow.includes(dispatchType)) {
    fail(`Production smoke workflow must handle ${dispatchType} repository dispatch events.`);
  }
}

const leetcodeSyncWorkflow = readFileSync('.github/workflows/leetcode-sync.yml', 'utf8');

if (!leetcodeSyncWorkflow.includes('npm run sync:leetcode -- --username adonis-14')) {
  fail('LeetCode sync workflow must sync the configured public LeetCode.cn username.');
}

for (const scriptName of ['ops:public-identity-guard', 'ops:production-smoke', 'ops:pr-health', 'ops:watch-pushed-deployment']) {
  if (!(scriptName in (packageJson.scripts ?? {}))) {
    fail(`package.json must expose ${scriptName}.`);
  }
}

if (!('sync:leetcode' in (packageJson.scripts ?? {}))) {
  fail('package.json must expose sync:leetcode.');
}

const publicThemeSkill = readFileSync('.codex/skills/starry-summer-public-theme-review/SKILL.md', 'utf8');

for (const requiredPhrase of [
  'light and dark public themes',
  'cyber archive',
  'old light card system',
  '/posts',
  '/series',
  '/archives',
  'horizontal overflow',
  'taxonomy chips',
]) {
  if (!publicThemeSkill.includes(requiredPhrase)) {
    fail(`Public theme review skill must mention "${requiredPhrase}".`);
  }
}

const postPushWatcherSkillPath = '.codex/skills/codex-post-push-watcher/SKILL.md';
const postPushWatcherDocPath = 'docs/ops/codex-post-push-watcher.md';

if (!existsSync(postPushWatcherSkillPath)) {
  fail('Codex post-push watcher skill must be available in .codex/skills.');
}

const postPushWatcherSkill = readFileSync(postPushWatcherSkillPath, 'utf8');

for (const forbiddenPhrase of ['TODO', '[TODO']) {
  if (postPushWatcherSkill.includes(forbiddenPhrase)) {
    fail(`Codex post-push watcher skill must not contain ${forbiddenPhrase}.`);
  }
}

for (const requiredPhrase of [
  'PostToolUse',
  'git push',
  'watch-pushed-deployment',
  'repository_dispatch',
  'Vercel',
  'gh',
  '.codex/local/post-push-status.jsonl',
]) {
  if (!postPushWatcherSkill.includes(requiredPhrase)) {
    fail(`Codex post-push watcher skill must mention "${requiredPhrase}".`);
  }
}

if (!existsSync(postPushWatcherDocPath)) {
  fail('Codex post-push watcher must have standalone ops documentation.');
}

const readme = readFileSync('README.md', 'utf8');

for (const requiredPhrase of ['Codex post-push watcher', postPushWatcherDocPath]) {
  if (!readme.includes(requiredPhrase)) {
    fail(`README must introduce the Codex post-push watcher with "${requiredPhrase}".`);
  }
}

const appIcon = readFileSync('apps/web/src/app/icon.svg', 'utf8');

for (const requiredPhrase of ['Starry Summer moon star icon', 'viewBox="0 0 64 64"', 'aria-labelledby="title"']) {
  if (!appIcon.includes(requiredPhrase)) {
    fail(`App icon must include "${requiredPhrase}".`);
  }
}

if (/<text\b|A\.H|star orbit|stroke-linecap="round"/.test(appIcon)) {
  fail('App icon must stay textless and avoid face-like orbit compositions at favicon sizes.');
}

console.log('Repository hygiene tests passed');

function fail(message) {
  console.error(message);
  process.exit(1);
}
