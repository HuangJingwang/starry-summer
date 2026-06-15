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
DOMAIN=blog.aster.test
PUBLIC_SITE_URL=https://blog.aster.test
ACME_EMAIL=admin@aster.test
ADMIN_EMAIL=owner@aster.test
ADMIN_PASSWORD_HASH=scrypt:32768:8:1:abcdef0123456789:abcdef0123456789abcdef0123456789
SESSION_SECRET=abcdefghijklmnopqrstuvwxyz123456
INTERACTION_HASH_SECRET=123456abcdefghijklmnopqrstuvwxyz
GITHUB_CLIENT_ID=github-oauth-client-id
GITHUB_CLIENT_SECRET=github-oauth-client-secret
GITHUB_CALLBACK_URL=https://blog.aster.test/api/auth/github/callback
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

missing_callback_env="$tmp_dir/missing-callback.env"
write_valid_env "$missing_callback_env"
remove_env_key "GITHUB_CALLBACK_URL" "$missing_callback_env"

if bash "$repo_root/scripts/doctor.sh" "$missing_callback_env" >"$tmp_dir/missing-callback.log" 2>&1; then
  echo "Deployment doctor accepted a missing GitHub callback URL."
  cat "$tmp_dir/missing-callback.log"
  exit 1
fi

if ! grep -q 'GITHUB_CALLBACK_URL must be set to the GitHub OAuth callback URL.' "$tmp_dir/missing-callback.log"; then
  echo "Deployment doctor did not explain the missing GitHub callback URL."
  cat "$tmp_dir/missing-callback.log"
  exit 1
fi

mismatched_callback_env="$tmp_dir/mismatched-callback.env"
write_valid_env "$mismatched_callback_env"
replace_env_key "GITHUB_CALLBACK_URL" "https://other.aster.test/api/auth/github/callback" "$mismatched_callback_env"

if bash "$repo_root/scripts/doctor.sh" "$mismatched_callback_env" >"$tmp_dir/mismatched-callback.log" 2>&1; then
  echo "Deployment doctor accepted a GitHub callback URL for the wrong host."
  cat "$tmp_dir/mismatched-callback.log"
  exit 1
fi

if ! grep -q 'GITHUB_CALLBACK_URL must equal PUBLIC_SITE_URL plus /api/auth/github/callback.' "$tmp_dir/mismatched-callback.log"; then
  echo "Deployment doctor did not explain the mismatched GitHub callback URL."
  cat "$tmp_dir/mismatched-callback.log"
  exit 1
fi

wrong_path_callback_env="$tmp_dir/wrong-path-callback.env"
write_valid_env "$wrong_path_callback_env"
replace_env_key "GITHUB_CALLBACK_URL" "https://blog.aster.test/oauth/callback" "$wrong_path_callback_env"

if bash "$repo_root/scripts/doctor.sh" "$wrong_path_callback_env" >"$tmp_dir/wrong-path-callback.log" 2>&1; then
  echo "Deployment doctor accepted a GitHub callback URL with the wrong path."
  cat "$tmp_dir/wrong-path-callback.log"
  exit 1
fi

if ! grep -q 'GITHUB_CALLBACK_URL must equal PUBLIC_SITE_URL plus /api/auth/github/callback.' "$tmp_dir/wrong-path-callback.log"; then
  echo "Deployment doctor did not explain the wrong GitHub callback path."
  cat "$tmp_dir/wrong-path-callback.log"
  exit 1
fi

echo "Deployment doctor tests passed"
