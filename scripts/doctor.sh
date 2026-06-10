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

case "${DOMAIN:-}" in
  "" | localhost | 127.0.0.1)
    fail "DOMAIN must be your public domain, not localhost."
    ;;
esac

if [[ "${PUBLIC_SITE_URL:-}" != https://* ]]; then
  fail "PUBLIC_SITE_URL must start with https:// for production."
fi

if [[ "${ACME_EMAIL:-}" != *@* ]]; then
  fail "ACME_EMAIL must be a valid email for HTTPS certificates."
fi

if [[ "${ADMIN_EMAIL:-}" != *@* ]]; then
  fail "ADMIN_EMAIL must be a valid owner login email."
fi

if is_unset_or_placeholder "${ADMIN_PASSWORD_HASH:-}"; then
  fail "ADMIN_PASSWORD_HASH is still a placeholder."
fi

session_secret="${SESSION_SECRET:-}"

if [[ ${#session_secret} -lt 32 ]] || is_unset_or_placeholder "$session_secret"; then
  fail "SESSION_SECRET must be at least 32 characters and not a placeholder."
fi

case "${POSTGRES_PASSWORD:-}" in
  "" | starry | postgres | password | change-me-before-production)
    fail "POSTGRES_PASSWORD must not use a default or weak value."
    ;;
esac

if [[ -z "${DATABASE_URL:-}" ]]; then
  fail "DATABASE_URL must be set for the API database connection."
elif [[ "${DATABASE_URL}" == *":starry@"* ]]; then
  fail "DATABASE_URL must not use the default starry database password."
elif [[ "${DATABASE_URL}" == *":postgres@"* || "${DATABASE_URL}" == *":password@"* ]]; then
  fail "DATABASE_URL must not use a default database password."
fi

case "${STORAGE_DRIVER:-local}" in
  local | s3)
    ;;
  *)
    fail "STORAGE_DRIVER must be either local or s3."
    ;;
esac

case "${S3_ACCESS_KEY:-}" in
  "" | minioadmin | access-key | change-me-before-production)
    fail "S3_ACCESS_KEY must not use a default or placeholder value."
    ;;
esac

case "${S3_SECRET_KEY:-}" in
  "" | minioadmin | secret-key | change-me-before-production)
    fail "S3_SECRET_KEY must not use a default or placeholder value."
    ;;
esac

if [[ "$errors" -gt 0 ]]; then
  echo "Deployment environment has $errors issue(s)."
  exit 1
fi

echo "Deployment environment looks ready."
