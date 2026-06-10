#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
tmp_dir="$(mktemp -d)"

cleanup() {
  rm -rf "$tmp_dir"
}

trap cleanup EXIT

cat >"$tmp_dir/docker" <<'SH'
#!/usr/bin/env bash
set -euo pipefail

printf '%s\n' "$*" >>"${RESTORE_TEST_DOCKER_LOG:?}"

if [[ "$1" == "compose" && "$2" == "up" && "$3" == "-d" && "$4" == "postgres" ]]; then
  exit 0
fi

if [[ "$1" == "compose" && "$2" == "exec" && "$5" == "psql" ]]; then
  cat >/dev/null
  exit 0
fi

if [[ "$1" == "volume" && "$2" == "create" ]]; then
  exit 0
fi

if [[ "$1" == "run" ]]; then
  exit 0
fi

printf 'unexpected docker invocation: %s\n' "$*" >&2
exit 1
SH
chmod +x "$tmp_dir/docker"

backup_dir="$tmp_dir/backup"
mkdir -p "$backup_dir"
printf '%s\n' '-- fake postgres dump --' >"$backup_dir/postgres.sql"
printf '%s\n' 'fake upload archive' >"$backup_dir/api-uploads.tar.gz"

export RESTORE_TEST_DOCKER_LOG="$tmp_dir/docker.log"

echo "Running restore script tests"
PATH="$tmp_dir:$PATH" RESTORE_CONFIRM=YES bash "$repo_root/scripts/restore.sh" "$backup_dir"

if ! grep -q -- '-v ON_ERROR_STOP=1' "$RESTORE_TEST_DOCKER_LOG"; then
  echo "Expected restore psql invocation to include ON_ERROR_STOP=1."
  cat "$RESTORE_TEST_DOCKER_LOG"
  exit 1
fi

if ! grep -q -- 'volume create starry-summer_api-uploads' "$RESTORE_TEST_DOCKER_LOG"; then
  echo "Expected restore script to recreate the api uploads volume when an archive is present."
  cat "$RESTORE_TEST_DOCKER_LOG"
  exit 1
fi

echo "Restore script tests passed"
