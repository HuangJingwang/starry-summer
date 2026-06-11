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

if [[ -d "$backup_dir" ]] && [[ -n "$(find "$backup_dir" -mindepth 1 -maxdepth 1 -print -quit)" ]]; then
  echo "Backup directory already exists and is not empty: $backup_dir"
  echo "Choose a new backup directory to avoid mixing backup sets."
  exit 1
fi

mkdir -p "$backup_dir"
absolute_backup_dir="$(cd "$backup_dir" && pwd)"

echo "Writing backup to $backup_dir"

postgres_dump_tmp="$backup_dir/postgres.sql.tmp"

if ! docker compose exec -T postgres pg_dump --clean --if-exists -U "$postgres_user" "$postgres_db" > "$postgres_dump_tmp"; then
  rm -f "$postgres_dump_tmp" "$backup_dir/postgres.sql"
  echo "PostgreSQL backup failed."
  exit 1
fi

if [[ ! -s "$postgres_dump_tmp" ]]; then
  rm -f "$postgres_dump_tmp" "$backup_dir/postgres.sql"
  echo "PostgreSQL backup produced an empty dump."
  exit 1
fi

mv "$postgres_dump_tmp" "$backup_dir/postgres.sql"

backup_volume() {
  local volume_name="$1"
  local archive_name="$2"

  if ! docker volume inspect "$volume_name" >/dev/null 2>&1; then
    echo "Skipping missing volume $volume_name"
    return
  fi

  docker run --rm \
    -v "$volume_name:/from:ro" \
    -v "$absolute_backup_dir:/backup" \
    alpine:3.20 \
    sh -lc "cd /from && tar czf /backup/$archive_name ."
}

backup_volume "${compose_project_name}_api-uploads" "api-uploads.tar.gz"
backup_volume "${compose_project_name}_minio-data" "minio-data.tar.gz"

{
  echo "created_at=$timestamp"
  echo "compose_project_name=$compose_project_name"
  git rev-parse --short HEAD 2>/dev/null | sed 's/^/git_revision=/'
} > "$backup_dir/manifest.txt"

echo "Backup complete: $backup_dir"
