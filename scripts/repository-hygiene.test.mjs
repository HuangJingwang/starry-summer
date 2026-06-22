import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const requiredFiles = ['LICENSE', 'CONTRIBUTING.md', 'SECURITY.md'];
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

if (!/^ADMIN_EMAIL=owner@example\.com$/m.test(envExample)) {
  fail('.env.example must keep ADMIN_EMAIL as a generic placeholder.');
}

if (!/^ADMIN_PASSWORD_HASH=replace-with-scrypt-hash$/m.test(envExample)) {
  fail('.env.example must not contain a real admin password hash.');
}

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

for (const requiredVariable of [
  'GITHUB_CONTENT_OWNER',
  'GITHUB_CONTENT_REPO',
  'GITHUB_CONTENT_BRANCH',
  'GITHUB_CONTENT_TOKEN',
  'REPOSITORY_PUBLISH_SECRET',
]) {
  if (!new RegExp(`^${requiredVariable}=`, 'm').test(envExample)) {
    fail(`.env.example must document repository publishing variable ${requiredVariable}.`);
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

  if (ci.includes('docker compose')) {
    fail('CI workflow must not validate Docker Compose after removing the Docker deployment path.');
  }
}

console.log('Repository hygiene tests passed');

function fail(message) {
  console.error(message);
  process.exit(1);
}
