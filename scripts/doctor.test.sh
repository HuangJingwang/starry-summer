#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
tmp_dir="$(mktemp -d)"

cleanup() {
  rm -rf "$tmp_dir"
}

trap cleanup EXIT

write_valid_env() {
  local env_file="$1"

  cat >"$env_file" <<'ENV'
NODE_ENV=production
PUBLIC_SITE_URL=https://blog.aster.test
INTERACTION_HASH_SECRET=123456abcdefghijklmnopqrstuvwxyz
ENV
}

remove_env_key() {
  local key="$1"
  local env_file="$2"
  local next_file="$env_file.next"

  grep -v "^$key=" "$env_file" >"$next_file"
  mv "$next_file" "$env_file"
}

replace_env_key() {
  local key="$1"
  local value="$2"
  local env_file="$3"
  local next_file="$env_file.next"

  awk -v key="$key" -v value="$value" '
    $0 ~ "^" key "=" {
      print key "=" value
      next
    }
    { print }
  ' "$env_file" >"$next_file"
  mv "$next_file" "$env_file"
}

echo "Running deployment doctor tests"

valid_env="$tmp_dir/valid.env"
write_valid_env "$valid_env"

if ! bash "$repo_root/scripts/doctor.sh" "$valid_env" >"$tmp_dir/valid.log" 2>&1; then
  echo "Deployment doctor rejected a valid production environment."
  cat "$tmp_dir/valid.log"
  exit 1
fi

placeholder_interaction_secret_env="$tmp_dir/placeholder-interaction-secret.env"
write_valid_env "$placeholder_interaction_secret_env"
replace_env_key "INTERACTION_HASH_SECRET" "replace-with-random-secret" "$placeholder_interaction_secret_env"

if bash "$repo_root/scripts/doctor.sh" "$placeholder_interaction_secret_env" >"$tmp_dir/placeholder-interaction-secret.log" 2>&1; then
  echo "Deployment doctor accepted a placeholder interaction hash secret."
  cat "$tmp_dir/placeholder-interaction-secret.log"
  exit 1
fi

if ! grep -q 'INTERACTION_HASH_SECRET must be at least 32 characters and not a placeholder.' "$tmp_dir/placeholder-interaction-secret.log"; then
  echo "Deployment doctor did not explain the placeholder interaction hash secret."
  cat "$tmp_dir/placeholder-interaction-secret.log"
  exit 1
fi

echo "Deployment doctor tests passed"
