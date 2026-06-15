#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
tmp_dir="$(mktemp -d)"

cleanup() {
  rm -rf "$tmp_dir"
}

trap cleanup EXIT

cat >"$tmp_dir/git" <<'SH'
#!/usr/bin/env bash
set -euo pipefail

printf '%s\n' "$*" >>"${DEPLOY_TEST_GIT_LOG:?}"

if [[ "$1" == "diff" && "$2" == "--quiet" ]]; then
  [[ "${FAKE_GIT_DIRTY:-false}" == "true" ]] && exit 1
  exit 0
fi

if [[ "$1" == "diff" && "$2" == "--cached" && "$3" == "--quiet" ]]; then
  [[ "${FAKE_GIT_STAGED_DIRTY:-false}" == "true" ]] && exit 1
  exit 0
fi

if [[ "$1" == "status" && "$2" == "--porcelain" && "$3" == "--untracked-files=all" ]]; then
  if [[ "${FAKE_GIT_DIRTY:-false}" == "true" ]]; then
    printf ' M scripts/deploy.sh\n'
  elif [[ "${FAKE_GIT_STAGED_DIRTY:-false}" == "true" ]]; then
    printf 'M  scripts/deploy.sh\n'
  elif [[ "${FAKE_GIT_UNTRACKED:-false}" == "true" ]]; then
    printf '?? stray.txt\n'
  fi
  exit 0
fi

if [[ "$1" == "rev-parse" && "$2" == "--short" && "$3" == "HEAD" ]]; then
  printf '%s\n' "${FAKE_GIT_REVISION:-abc1234}"
  exit 0
fi

printf 'unexpected git invocation: %s\n' "$*" >&2
exit 1
SH
chmod +x "$tmp_dir/git"

cat >"$tmp_dir/date" <<'SH'
#!/usr/bin/env bash
set -euo pipefail

printf '%s\n' "$*" >>"${DEPLOY_TEST_DATE_LOG:?}"

if [[ "$1" == "-u" && "$2" == "+%Y%m%d%H%M%S" ]]; then
  printf '%s\n' "${FAKE_RELEASE_VERSION:-20260611091500}"
  exit 0
fi

printf 'unexpected date invocation: %s\n' "$*" >&2
exit 1
SH
chmod +x "$tmp_dir/date"

cat >"$tmp_dir/npm" <<'SH'
#!/usr/bin/env bash
set -euo pipefail

printf '%s\n' "$*" >>"${DEPLOY_TEST_NPM_LOG:?}"

if [[ "$1" == "run" && "$2" == "ops:doctor" && "$3" == "--" ]]; then
  exit 0
fi

if [[ "$1" == "run" && "$2" == "ops:smoke" && "$3" == "--" ]]; then
  exit 0
fi

printf 'unexpected npm invocation: %s\n' "$*" >&2
exit 1
SH
chmod +x "$tmp_dir/npm"

cat >"$tmp_dir/docker" <<'SH'
#!/usr/bin/env bash
set -euo pipefail

printf '%s\n' "$*" >>"${DEPLOY_TEST_DOCKER_LOG:?}"

if [[ "$1" == "compose" && "$2" == "--env-file" && -n "$3" ]]; then
  case "${4:-}" in
    config)
      [[ "${5:-}" == "--quiet" ]] && exit 0
      ;;
    build)
      exit 0
      ;;
    up)
      [[ "${5:-}" == "-d" ]] && exit 0
      ;;
  esac
fi

printf 'unexpected docker invocation: %s\n' "$*" >&2
exit 1
SH
chmod +x "$tmp_dir/docker"

export DEPLOY_TEST_GIT_LOG="$tmp_dir/git.log"
export DEPLOY_TEST_DATE_LOG="$tmp_dir/date.log"
export DEPLOY_TEST_NPM_LOG="$tmp_dir/npm.log"
export DEPLOY_TEST_DOCKER_LOG="$tmp_dir/docker.log"

echo "Running deploy script tests"

if PATH="$tmp_dir:$PATH" bash "$repo_root/scripts/deploy.sh" >"$tmp_dir/missing-url.log" 2>&1; then
  echo "Deploy script accepted a missing site URL."
  cat "$tmp_dir/missing-url.log"
  exit 1
fi

if ! grep -q 'Usage: npm run ops:deploy -- https://example.com' "$tmp_dir/missing-url.log"; then
  echo "Deploy script did not print usage for a missing site URL."
  cat "$tmp_dir/missing-url.log"
  exit 1
fi

if PATH="$tmp_dir:$PATH" bash "$repo_root/scripts/deploy.sh" "http://example.com" >"$tmp_dir/http-url.log" 2>&1; then
  echo "Deploy script accepted a non-HTTPS site URL."
  cat "$tmp_dir/http-url.log"
  exit 1
fi

if ! grep -q 'Deploy site URL must start with https://.' "$tmp_dir/http-url.log"; then
  echo "Deploy script did not explain non-HTTPS site URL refusal."
  cat "$tmp_dir/http-url.log"
  exit 1
fi

printf 'PUBLIC_SITE_URL=https://blog.starry-summer.dev\n' >"$tmp_dir/.env.production"

if PATH="$tmp_dir:$PATH" ENV_FILE="$tmp_dir/.env.production" bash "$repo_root/scripts/deploy.sh" "https://wrong.starry-summer.dev" >"$tmp_dir/mismatched-site-url.log" 2>&1; then
  echo "Deploy script accepted a site URL that differs from PUBLIC_SITE_URL."
  cat "$tmp_dir/mismatched-site-url.log"
  exit 1
fi

if ! grep -q 'Deploy site URL must match PUBLIC_SITE_URL in the environment file.' "$tmp_dir/mismatched-site-url.log"; then
  echo "Deploy script did not explain PUBLIC_SITE_URL mismatch."
  cat "$tmp_dir/mismatched-site-url.log"
  exit 1
fi

printf 'PUBLIC_SITE_URL=https://example.com\n' >"$tmp_dir/.env.matching"

if PATH="$tmp_dir:$PATH" ENV_FILE="$tmp_dir/.env.matching" FAKE_GIT_DIRTY=true bash "$repo_root/scripts/deploy.sh" "https://example.com" >"$tmp_dir/dirty.log" 2>&1; then
  echo "Deploy script accepted a dirty worktree."
  cat "$tmp_dir/dirty.log"
  exit 1
fi

if ! grep -q 'Refusing to deploy with uncommitted changes.' "$tmp_dir/dirty.log"; then
  echo "Deploy script did not explain dirty worktree refusal."
  cat "$tmp_dir/dirty.log"
  exit 1
fi

if PATH="$tmp_dir:$PATH" ENV_FILE="$tmp_dir/.env.matching" FAKE_GIT_UNTRACKED=true bash "$repo_root/scripts/deploy.sh" "https://example.com" >"$tmp_dir/untracked.log" 2>&1; then
  echo "Deploy script accepted untracked files."
  cat "$tmp_dir/untracked.log"
  exit 1
fi

if ! grep -q 'Refusing to deploy with uncommitted changes.' "$tmp_dir/untracked.log"; then
  echo "Deploy script did not explain untracked file refusal."
  cat "$tmp_dir/untracked.log"
  exit 1
fi

: >"$DEPLOY_TEST_GIT_LOG"
: >"$DEPLOY_TEST_DATE_LOG"
: >"$DEPLOY_TEST_NPM_LOG"
: >"$DEPLOY_TEST_DOCKER_LOG"

PATH="$tmp_dir:$PATH" ENV_FILE=.env.production bash "$repo_root/scripts/deploy.sh" "https://example.com/" >"$tmp_dir/deploy.log"

if ! grep -q 'Release version: 20260611091500' "$tmp_dir/deploy.log"; then
  echo "Deploy script did not print the generated release version."
  cat "$tmp_dir/deploy.log"
  exit 1
fi

if ! grep -q 'Git revision: abc1234' "$tmp_dir/deploy.log"; then
  echo "Deploy script did not print the git revision."
  cat "$tmp_dir/deploy.log"
  exit 1
fi

if ! grep -q 'run ops:doctor -- .env.production' "$DEPLOY_TEST_NPM_LOG"; then
  echo "Deploy script did not run the environment doctor with ENV_FILE."
  cat "$DEPLOY_TEST_NPM_LOG"
  exit 1
fi

if ! grep -q 'run ops:smoke -- https://example.com' "$DEPLOY_TEST_NPM_LOG"; then
  echo "Deploy script did not smoke test the normalized site URL."
  cat "$DEPLOY_TEST_NPM_LOG"
  exit 1
fi

if ! grep -q 'compose --env-file .env.production build' "$DEPLOY_TEST_DOCKER_LOG"; then
  echo "Deploy script did not build with the configured env file."
  cat "$DEPLOY_TEST_DOCKER_LOG"
  exit 1
fi

if ! grep -q 'compose --env-file .env.production config --quiet' "$DEPLOY_TEST_DOCKER_LOG"; then
  echo "Deploy script did not validate the Compose config before deployment."
  cat "$DEPLOY_TEST_DOCKER_LOG"
  exit 1
fi

config_line="$(grep -n 'compose --env-file .env.production config --quiet' "$DEPLOY_TEST_DOCKER_LOG" | head -n1 | cut -d: -f1)"
build_line="$(grep -n 'compose --env-file .env.production build' "$DEPLOY_TEST_DOCKER_LOG" | head -n1 | cut -d: -f1)"

if [[ "$config_line" -ge "$build_line" ]]; then
  echo "Deploy script validated the Compose config after build had already started."
  cat "$DEPLOY_TEST_DOCKER_LOG"
  exit 1
fi

if grep -q 'compose --env-file .env.production run --rm migrate' "$DEPLOY_TEST_DOCKER_LOG"; then
  echo "Deploy script still runs database migrations."
  cat "$DEPLOY_TEST_DOCKER_LOG"
  exit 1
fi

if ! grep -q 'compose --env-file .env.production up -d' "$DEPLOY_TEST_DOCKER_LOG"; then
  echo "Deploy script did not start the stack with the configured env file."
  cat "$DEPLOY_TEST_DOCKER_LOG"
  exit 1
fi

echo "Deploy script tests passed"
