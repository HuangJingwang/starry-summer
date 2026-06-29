#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

env_file="${1:-.env}"

if [[ ! -f "$env_file" ]]; then
  echo "Environment file not found: $env_file"
  echo "Usage: npm run ops:doctor -- .env"
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$env_file"
set +a

errors=0

fail() {
  echo "[error] $1"
  errors=$((errors + 1))
}

is_unset_or_placeholder() {
  local value="${1:-}"

  [[ -z "$value" || "$value" == replace-* || "$value" == change-* ]]
}

if [[ "${PUBLIC_SITE_URL:-}" != https://* ]]; then
  fail "PUBLIC_SITE_URL must start with https:// for production."
fi

public_site_host="$(
  node -e "try { process.stdout.write(new URL(process.argv[1]).hostname) } catch { process.exit(1) }" "${PUBLIC_SITE_URL:-}" 2>/dev/null || true
)"

if [[ -z "$public_site_host" ]]; then
  fail "PUBLIC_SITE_URL must be a valid URL."
fi

if [[ "$public_site_host" == "example.com" || "$public_site_host" == *.example.com ]]; then
  fail "PUBLIC_SITE_URL must not use an example.com placeholder."
fi

interaction_hash_secret="${INTERACTION_HASH_SECRET:-}"

if [[ -n "$interaction_hash_secret" && (${#interaction_hash_secret} -lt 32 || "$interaction_hash_secret" == replace-* || "$interaction_hash_secret" == change-*) ]]; then
  fail "INTERACTION_HASH_SECRET must be at least 32 characters and not a placeholder."
fi

if [[ "$errors" -gt 0 ]]; then
  echo "Deployment environment has $errors issue(s)."
  exit 1
fi

echo "Deployment environment looks ready."
