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
missing_manifest_dir="$tmp_dir/missing-manifest"
missing_project_manifest_dir="$tmp_dir/missing-project-manifest"
wrong_project_dir="$tmp_dir/wrong-project"
corrupt_archive_dir="$tmp_dir/corrupt-archive"
mkdir -p "$backup_dir"
mkdir -p "$missing_manifest_dir"
mkdir -p "$missing_project_manifest_dir"
mkdir -p "$wrong_project_dir"
mkdir -p "$corrupt_archive_dir"
printf '%s\n' '-- fake postgres dump --' >"$backup_dir/postgres.sql"
mkdir -p "$tmp_dir/archive-source"
printf '%s\n' 'fake upload archive' >"$tmp_dir/archive-source/file.txt"
LC_ALL=C tar czf "$backup_dir/api-uploads.tar.gz" -C "$tmp_dir/archive-source" .
printf '%s\n' '-- fake postgres dump --' >"$missing_manifest_dir/postgres.sql"
printf '%s\n' '-- fake postgres dump --' >"$missing_project_manifest_dir/postgres.sql"
printf '%s\n' 'created_at=2026-06-11-093300' 'git_revision=abc1234' >"$missing_project_manifest_dir/manifest.txt"
printf '%s\n' '-- fake postgres dump --' >"$wrong_project_dir/postgres.sql"
printf '%s\n' 'created_at=2026-06-11-093300' 'compose_project_name=other-site' 'git_revision=abc1234' >"$wrong_project_dir/manifest.txt"
printf '%s\n' '-- fake postgres dump --' >"$corrupt_archive_dir/postgres.sql"
printf '%s\n' 'created_at=2026-06-11-093300' 'compose_project_name=starry-summer' 'git_revision=abc1234' >"$corrupt_archive_dir/manifest.txt"
printf '%s\n' 'not a gzip archive' >"$corrupt_archive_dir/api-uploads.tar.gz"

export RESTORE_TEST_DOCKER_LOG="$tmp_dir/docker.log"

echo "Running restore script tests"

if PATH="$tmp_dir:$PATH" RESTORE_CONFIRM=YES bash "$repo_root/scripts/restore.sh" "$missing_manifest_dir" >"$tmp_dir/missing-manifest.log" 2>&1; then
  echo "Restore script accepted a directory without a manifest."
  cat "$tmp_dir/missing-manifest.log"
  exit 1
fi

if ! grep -q 'Backup manifest not found' "$tmp_dir/missing-manifest.log"; then
  echo "Restore script did not explain missing manifest refusal."
  cat "$tmp_dir/missing-manifest.log"
  exit 1
fi

if PATH="$tmp_dir:$PATH" RESTORE_CONFIRM=YES bash "$repo_root/scripts/restore.sh" "$missing_project_manifest_dir" >"$tmp_dir/missing-project-manifest.log" 2>&1; then
  echo "Restore script accepted a manifest without a Compose project name."
  cat "$tmp_dir/missing-project-manifest.log"
  exit 1
fi

if ! grep -q 'Backup manifest does not include compose_project_name.' "$tmp_dir/missing-project-manifest.log"; then
  echo "Restore script did not explain missing Compose project name refusal."
  cat "$tmp_dir/missing-project-manifest.log"
  exit 1
fi

if PATH="$tmp_dir:$PATH" RESTORE_CONFIRM=YES bash "$repo_root/scripts/restore.sh" "$wrong_project_dir" >"$tmp_dir/wrong-project.log" 2>&1; then
  echo "Restore script accepted a backup from a different Compose project."
  cat "$tmp_dir/wrong-project.log"
  exit 1
fi

if ! grep -q 'Backup Compose project does not match the current Compose project.' "$tmp_dir/wrong-project.log"; then
  echo "Restore script did not explain Compose project mismatch refusal."
  cat "$tmp_dir/wrong-project.log"
  exit 1
fi

if PATH="$tmp_dir:$PATH" RESTORE_CONFIRM=YES bash "$repo_root/scripts/restore.sh" "$corrupt_archive_dir" >"$tmp_dir/corrupt-archive.log" 2>&1; then
  echo "Restore script accepted a corrupt backup archive."
  cat "$tmp_dir/corrupt-archive.log"
  exit 1
fi

if ! grep -q 'Backup archive is not a valid tar.gz' "$tmp_dir/corrupt-archive.log"; then
  echo "Restore script did not explain corrupt archive refusal."
  cat "$tmp_dir/corrupt-archive.log"
  exit 1
fi

if [[ -f "$RESTORE_TEST_DOCKER_LOG" ]] && grep -q -- '-v ON_ERROR_STOP=1' "$RESTORE_TEST_DOCKER_LOG"; then
  echo "Restore script touched PostgreSQL before rejecting the corrupt archive."
  cat "$RESTORE_TEST_DOCKER_LOG"
  exit 1
fi

printf '%s\n' 'created_at=2026-06-11-093300' 'compose_project_name=starry-summer' 'git_revision=abc1234' >"$backup_dir/manifest.txt"
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
