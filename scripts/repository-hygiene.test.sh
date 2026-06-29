#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "Running repository hygiene tests"

assert_file() {
  local file="$1"

  if [[ ! -f "$repo_root/$file" ]]; then
    echo "Expected repository file is missing: $file"
    exit 1
  fi
}

assert_file "LICENSE"
assert_file "CONTRIBUTING.md"
assert_file "SECURITY.md"
assert_file ".github/workflows/ci.yml"

node --input-type=module <<'NODE'
import { readFileSync } from 'node:fs';

const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
const missing = [];

if (packageJson.license !== 'MIT') missing.push('license');
if (!packageJson.repository?.url) missing.push('repository.url');
if (!packageJson.bugs?.url) missing.push('bugs.url');
if (!packageJson.homepage) missing.push('homepage');

if (missing.length > 0) {
  console.error(`package.json is missing open-source metadata: ${missing.join(', ')}`);
  process.exit(1);
}
NODE

if grep -q 'npm.runtongqiuben.com' "$repo_root/package-lock.json"; then
  echo "package-lock.json must not reference a private npm registry mirror."
  exit 1
fi

if grep -Eq '^[A-Z_]*(SECRET|TOKEN|PASSWORD|KEY|HASH)=scrypt:' "$repo_root/.env.example"; then
  echo ".env.example contains a generated secret or password hash."
  exit 1
fi

for removed_variable in \
  ADMIN_EMAIL \
  ADMIN_PASSWORD_HASH \
  SESSION_SECRET \
  GITHUB_CONTENT_OWNER \
  GITHUB_CONTENT_REPO \
  GITHUB_CONTENT_BRANCH \
  GITHUB_CONTENT_TOKEN \
  REPOSITORY_PUBLISH_SECRET
do
  if grep -q "^${removed_variable}=" "$repo_root/.env.example"; then
    echo ".env.example must not document removed online admin or repository publishing variable ${removed_variable}."
    exit 1
  fi
done

if grep -Eq '^[A-Z_]*EMAIL=[0-9]{7,}$' "$repo_root/.env.example"; then
  echo ".env.example contains a numeric account identifier where a placeholder email is expected."
  exit 1
fi

tracked_files="$(git -C "$repo_root" ls-files)"

if grep -nE \
  "(ADMIN_EMAIL|DEFAULT_ADMIN_ACCOUNT|placeholder=|Admin login account:|admin account).*['\":= -][0-9]{7,}" \
  $tracked_files; then
  echo "Tracked files contain a numeric admin account identifier."
  exit 1
fi

if grep -nE \
  "(ADMIN_PASSWORD_HASH|DEFAULT_ADMIN_PASSWORD_HASH).*scrypt:[0-9]+:[0-9]+:[0-9]+:[0-9a-f]{16,}:[0-9a-f]{32,}" \
  $tracked_files; then
  echo "Tracked files contain a generated admin password hash."
  exit 1
fi

if ! grep -q 'npm test' "$repo_root/.github/workflows/ci.yml"; then
  echo "CI workflow must run the test suite."
  exit 1
fi

if ! grep -q 'npm run typecheck' "$repo_root/.github/workflows/ci.yml"; then
  echo "CI workflow must run TypeScript checks."
  exit 1
fi

if ! grep -q 'npm run build' "$repo_root/.github/workflows/ci.yml"; then
  echo "CI workflow must run the production build."
  exit 1
fi

echo "Repository hygiene tests passed"
