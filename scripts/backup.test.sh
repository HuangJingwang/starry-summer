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

printf '%s\n' "$*" >>"${BACKUP_TEST_DOCKER_LOG:?}"

if [[ "$1" == "compose" && "$2" == "exec" && "$5" == "pg_dump" ]]; then
  if [[ "${BACKUP_TEST_FAIL_PG_DUMP:-}" == "YES" ]]; then
    exit 1
  fi

  if [[ "${BACKUP_TEST_EMPTY_PG_DUMP:-}" == "YES" ]]; then
    exit 0
  fi

  printf '%s\n' '-- fake postgres dump --'
  exit 0
fi

if [[ "$1" == "volume" && "$2" == "inspect" ]]; then
  exit 1
fi

printf 'unexpected docker invocation: %s\n' "$*" >&2
exit 1
SH
chmod +x "$tmp_dir/docker"

backup_dir="$tmp_dir/backup"
existing_backup_dir="$tmp_dir/existing-backup"
failed_backup_dir="$tmp_dir/failed-backup"
empty_backup_dir="$tmp_dir/empty-backup"
export BACKUP_TEST_DOCKER_LOG="$tmp_dir/docker.log"

echo "Running backup script tests"

mkdir -p "$existing_backup_dir"
printf '%s\n' 'old backup marker' >"$existing_backup_dir/manifest.txt"

if PATH="$tmp_dir:$PATH" bash "$repo_root/scripts/backup.sh" "$existing_backup_dir" >"$tmp_dir/existing-backup.log" 2>&1; then
  echo "Backup script accepted an existing backup directory."
  cat "$tmp_dir/existing-backup.log"
  exit 1
fi

if ! grep -q 'Backup directory already exists' "$tmp_dir/existing-backup.log"; then
  echo "Backup script did not explain existing backup directory refusal."
  cat "$tmp_dir/existing-backup.log"
  exit 1
fi

if PATH="$tmp_dir:$PATH" BACKUP_TEST_FAIL_PG_DUMP=YES bash "$repo_root/scripts/backup.sh" "$failed_backup_dir" >"$tmp_dir/failed-backup.log" 2>&1; then
  echo "Backup script accepted a failed PostgreSQL dump."
  cat "$tmp_dir/failed-backup.log"
  exit 1
fi

if ! grep -q 'PostgreSQL backup failed.' "$tmp_dir/failed-backup.log"; then
  echo "Backup script did not explain PostgreSQL dump failure."
  cat "$tmp_dir/failed-backup.log"
  exit 1
fi

if [[ -d "$failed_backup_dir" && -n "$(find "$failed_backup_dir" -mindepth 1 -maxdepth 1 -print -quit)" ]]; then
  echo "Backup script left a partial backup after PostgreSQL dump failure."
  find "$failed_backup_dir" -maxdepth 1 -type f -print 2>/dev/null || true
  exit 1
fi

if PATH="$tmp_dir:$PATH" BACKUP_TEST_EMPTY_PG_DUMP=YES bash "$repo_root/scripts/backup.sh" "$empty_backup_dir" >"$tmp_dir/empty-backup.log" 2>&1; then
  echo "Backup script accepted an empty PostgreSQL dump."
  cat "$tmp_dir/empty-backup.log"
  exit 1
fi

if ! grep -q 'PostgreSQL backup produced an empty dump.' "$tmp_dir/empty-backup.log"; then
  echo "Backup script did not explain empty PostgreSQL dump refusal."
  cat "$tmp_dir/empty-backup.log"
  exit 1
fi

if [[ -d "$empty_backup_dir" && -n "$(find "$empty_backup_dir" -mindepth 1 -maxdepth 1 -print -quit)" ]]; then
  echo "Backup script left a partial backup after empty PostgreSQL dump."
  find "$empty_backup_dir" -maxdepth 1 -type f -print 2>/dev/null || true
  exit 1
fi

PATH="$tmp_dir:$PATH" bash "$repo_root/scripts/backup.sh" "$backup_dir"

if ! grep -q -- '--clean' "$BACKUP_TEST_DOCKER_LOG"; then
  echo "Expected pg_dump to include --clean."
  cat "$BACKUP_TEST_DOCKER_LOG"
  exit 1
fi

if ! grep -q -- '--if-exists' "$BACKUP_TEST_DOCKER_LOG"; then
  echo "Expected pg_dump to include --if-exists."
  cat "$BACKUP_TEST_DOCKER_LOG"
  exit 1
fi

if ! grep -q -- '-- fake postgres dump --' "$backup_dir/postgres.sql"; then
  echo "Expected postgres.sql to contain the pg_dump output."
  exit 1
fi

if ! grep -q '^postgres_sha256=' "$backup_dir/manifest.txt"; then
  echo "Expected backup manifest to include a PostgreSQL checksum."
  cat "$backup_dir/manifest.txt"
  exit 1
fi

echo "Backup script tests passed"
