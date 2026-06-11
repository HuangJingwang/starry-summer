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

if [[ "$site_url" != https://* ]]; then
  echo "Deploy site URL must start with https://."
  exit 1
fi

if [[ -f "$env_file" ]]; then
  env_public_site_url="$(
    set -a
    # shellcheck disable=SC1090
    source "$env_file"
    set +a
    printf '%s' "${PUBLIC_SITE_URL:-}"
  )"
  env_public_site_url="${env_public_site_url%/}"

  if [[ -n "$env_public_site_url" && "$env_public_site_url" != "$site_url" ]]; then
    echo "Deploy site URL must match PUBLIC_SITE_URL in the environment file."
    echo "Deploy argument: $site_url"
    echo "PUBLIC_SITE_URL: $env_public_site_url"
    exit 1
  fi
fi

if [[ "${ALLOW_DIRTY_DEPLOY:-false}" != "true" ]]; then
  if [[ -n "$(git status --porcelain --untracked-files=all)" ]]; then
    echo "Refusing to deploy with uncommitted changes."
    echo "Commit or stash local changes, or rerun with ALLOW_DIRTY_DEPLOY=true."
    exit 1
  fi
fi

npm run ops:doctor -- "$env_file"

docker compose --env-file "$env_file" config --quiet

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
