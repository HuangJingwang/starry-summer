#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

site_url="${1:-${SITE_URL:-}}"
env_file="${ENV_FILE:-.env}"

if [[ -z "$site_url" ]]; then
  echo "Usage: npm run ops:deploy -- https://example.com"
  echo "Set ENV_FILE=.env.production to use a different environment file."
  exit 1
fi

site_url="${site_url%/}"

if [[ "${ALLOW_DIRTY_DEPLOY:-false}" != "true" ]]; then
  if ! git diff --quiet || ! git diff --cached --quiet; then
    echo "Refusing to deploy with uncommitted changes."
    echo "Commit or stash local changes, or rerun with ALLOW_DIRTY_DEPLOY=true."
    exit 1
  fi
fi

npm run ops:doctor -- "$env_file"

release_version="$(date -u +%Y%m%d%H%M%S)"
git_revision="$(git rev-parse --short HEAD 2>/dev/null || printf 'unknown')"

export RELEASE_VERSION="${RELEASE_VERSION:-$release_version}"
export GIT_REVISION="${GIT_REVISION:-$git_revision}"

echo "Deploying Starry Summer"
echo "Site URL: $site_url"
echo "Environment file: $env_file"
echo "Release version: $RELEASE_VERSION"
echo "Git revision: $GIT_REVISION"

docker compose --env-file "$env_file" build
docker compose --env-file "$env_file" run --rm migrate
docker compose --env-file "$env_file" up -d

npm run ops:smoke -- "$site_url"

echo "Deployment finished for $site_url"
