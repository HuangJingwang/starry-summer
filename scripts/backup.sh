#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

timestamp="$(date +%F-%H%M%S)"
backup_dir="${1:-backups/starry-summer-$timestamp}"
compose_project_name="${COMPOSE_PROJECT_NAME:-$(basename "$repo_root")}"
postgres_user="${POSTGRES_USER:-starry}"
postgres_db="${POSTGRES_DB:-starry_summer}"

sha256_file() {
  local file_path="$1"

  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$file_path" | awk '{ print $1 }'
    return
  fi

  if command -v shasum >/dev/null 2>&1; then
    LC_ALL=C shasum -a 256 "$file_path" | awk '{ print $1 }'
    return
  fi

  echo "sha256sum or shasum is required to write backup checksums." >&2
  exit 1
}

if [[ -d "$backup_dir" ]] && [[ -n "$(find "$backup_dir" -mindepth 1 -maxdepth 1 -print -quit)" ]]; then
  echo "Backup directory already exists and is not empty: $backup_dir"
  echo "Choose a new backup directory to avoid mixing backup sets."
  exit 1
fi

mkdir -p "$backup_dir"
absolute_backup_dir="$(cd "$backup_dir" && pwd)"

cleanup_incomplete_backup() {
  rm -f \
    "$backup_dir/postgres.sql" \
    "$backup_dir/postgres.sql.tmp" \
    "$backup_dir/api-uploads.tar.gz" \
    "$backup_dir/api-uploads.tar.gz.tmp" \
    "$backup_dir/minio-data.tar.gz" \
    "$backup_dir/minio-data.tar.gz.tmp" \
    "$backup_dir/manifest.txt"
}

echo "Writing backup to $backup_dir"

postgres_dump_tmp="$backup_dir/postgres.sql.tmp"

if ! docker compose exec -T postgres pg_dump --clean --if-exists -U "$postgres_user" "$postgres_db" > "$postgres_dump_tmp"; then
  cleanup_incomplete_backup
  echo "PostgreSQL backup failed."
  exit 1
fi

if [[ ! -s "$postgres_dump_tmp" ]]; then
  cleanup_incomplete_backup
  echo "PostgreSQL backup produced an empty dump."
  exit 1
fi

mv "$postgres_dump_tmp" "$backup_dir/postgres.sql"

backup_volume() {
  local volume_name="$1"
  local archive_name="$2"
  local archive_tmp="$archive_name.tmp"

  if ! docker volume inspect "$volume_name" >/dev/null 2>&1; then
    echo "Skipping missing volume $volume_name"
    return
  fi

  if ! docker run --rm \
    -v "$volume_name:/from:ro" \
    -v "$absolute_backup_dir:/backup" \
    alpine:3.20 \
    sh -lc "cd /from && tar czf /backup/$archive_tmp ."; then
    cleanup_incomplete_backup
    echo "Backup volume failed: $volume_name"
    exit 1
  fi

  mv "$backup_dir/$archive_tmp" "$backup_dir/$archive_name"
}

backup_volume "${compose_project_name}_api-uploads" "api-uploads.tar.gz"
backup_volume "${compose_project_name}_minio-data" "minio-data.tar.gz"

{
  echo "created_at=$timestamp"
  echo "compose_project_name=$compose_project_name"
  echo "postgres_sha256=$(sha256_file "$backup_dir/postgres.sql")"
  if [[ -f "$backup_dir/api-uploads.tar.gz" ]]; then
    echo "api_uploads_sha256=$(sha256_file "$backup_dir/api-uploads.tar.gz")"
  fi
  if [[ -f "$backup_dir/minio-data.tar.gz" ]]; then
    echo "minio_data_sha256=$(sha256_file "$backup_dir/minio-data.tar.gz")"
  fi
  git rev-parse --short HEAD 2>/dev/null | sed 's/^/git_revision=/'
} > "$backup_dir/manifest.txt"

echo "Backup complete: $backup_dir"
