#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
tmp_dir="$(mktemp -d)"

cleanup() {
  rm -rf "$tmp_dir"
}

trap cleanup EXIT

env_file="$tmp_dir/.env"

echo "Running environment initializer tests"

if INIT_ENV_FILE="$env_file" bash "$repo_root/scripts/init-env.sh" "local-admin-password" >"$tmp_dir/init.log" 2>&1; then
  :
else
  echo "Environment initializer failed unexpectedly."
  cat "$tmp_dir/init.log"
  exit 1
fi

if [[ ! -f "$env_file" ]]; then
  echo "Environment initializer did not write the target env file."
  cat "$tmp_dir/init.log"
  exit 1
fi

if ! grep -q '^ADMIN_PASSWORD_HASH=scrypt:' "$env_file"; then
  echo "Environment initializer did not generate a scrypt admin password hash."
  cat "$env_file"
  exit 1
fi

if ! grep -Eq '^SESSION_SECRET=[A-Za-z0-9_-]{32,}$' "$env_file"; then
  echo "Environment initializer did not generate a strong session secret."
  cat "$env_file"
  exit 1
fi

if ! grep -Eq '^INTERACTION_HASH_SECRET=[A-Za-z0-9_-]{32,}$' "$env_file"; then
  echo "Environment initializer did not generate a strong interaction hash secret."
  cat "$env_file"
  exit 1
fi

for placeholder in replace-with-scrypt-hash replace-with-long-random-secret replace-with-long-random-interaction-secret; do
  if grep -q "$placeholder" "$env_file"; then
    echo "Environment initializer left placeholder value: $placeholder"
    cat "$env_file"
    exit 1
  fi
done

if INIT_ENV_FILE="$env_file" bash "$repo_root/scripts/init-env.sh" "local-admin-password" >"$tmp_dir/no-overwrite.log" 2>&1; then
  echo "Environment initializer overwrote an existing env file without confirmation."
  cat "$tmp_dir/no-overwrite.log"
  exit 1
fi

if ! grep -q 'already exists' "$tmp_dir/no-overwrite.log"; then
  echo "Environment initializer did not explain the overwrite guard."
  cat "$tmp_dir/no-overwrite.log"
  exit 1
fi

if INIT_ENV_OVERWRITE=YES INIT_ENV_FILE="$env_file" bash "$repo_root/scripts/init-env.sh" "new-local-password" >"$tmp_dir/overwrite.log" 2>&1; then
  :
else
  echo "Environment initializer did not allow explicit overwrite."
  cat "$tmp_dir/overwrite.log"
  exit 1
fi

if ! grep -q "Wrote environment file: $env_file" "$tmp_dir/overwrite.log"; then
  echo "Environment initializer did not report the written file."
  cat "$tmp_dir/overwrite.log"
  exit 1
fi

if INIT_ENV_FILE="$tmp_dir/missing-password.env" bash "$repo_root/scripts/init-env.sh" >"$tmp_dir/missing-password.log" 2>&1; then
  echo "Environment initializer accepted a missing admin password."
  cat "$tmp_dir/missing-password.log"
  exit 1
fi

if ! grep -q 'Usage:' "$tmp_dir/missing-password.log"; then
  echo "Environment initializer did not show usage for a missing admin password."
  cat "$tmp_dir/missing-password.log"
  exit 1
fi

echo "Environment initializer tests passed"
