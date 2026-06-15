#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

target_file="${INIT_ENV_FILE:-.env}"
admin_password="${1:-${ADMIN_PASSWORD:-}}"

usage() {
  echo 'Usage: npm run ops:init-env -- "your local admin password"'
  echo '       ADMIN_PASSWORD="your local admin password" npm run ops:init-env'
}

if [[ -z "$admin_password" ]]; then
  usage
  exit 1
fi

if [[ -f "$target_file" && "${INIT_ENV_OVERWRITE:-}" != "YES" ]]; then
  echo "Environment file already exists: $target_file"
  echo "Set INIT_ENV_OVERWRITE=YES to replace it."
  exit 1
fi

admin_password_hash="$(node scripts/admin-env.mjs hash-password "$admin_password")"
session_secret="$(node scripts/admin-env.mjs session-secret)"
interaction_hash_secret="$(node scripts/admin-env.mjs interaction-secret)"

tmp_file="$(mktemp)"

cleanup() {
  rm -f "$tmp_file"
}

trap cleanup EXIT

awk \
  -v admin_password_hash="$admin_password_hash" \
  -v session_secret="$session_secret" \
  -v interaction_hash_secret="$interaction_hash_secret" \
  '
  /^ADMIN_PASSWORD_HASH=/ {
    print admin_password_hash
    next
  }
  /^SESSION_SECRET=/ {
    print session_secret
    next
  }
  /^INTERACTION_HASH_SECRET=/ {
    print interaction_hash_secret
    next
  }
  {
    print
  }
  ' .env.example >"$tmp_file"

target_dir="$(dirname "$target_file")"
mkdir -p "$target_dir"
mv "$tmp_file" "$target_file"
trap - EXIT

echo "Wrote Docker environment file: $target_file"
echo "Admin login account: owner@example.com"
