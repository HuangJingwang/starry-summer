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

backup_dir="${1:-}"
compose_project_name="${COMPOSE_PROJECT_NAME:-$(basename "$repo_root")}"
postgres_user="${POSTGRES_USER:-starry}"
postgres_db="${POSTGRES_DB:-starry_summer}"

if [[ -z "$backup_dir" ]]; then
  echo "Usage: RESTORE_CONFIRM=YES npm run ops:restore -- backups/starry-summer-YYYY-MM-DD"
  exit 1
fi

if [[ ! -d "$backup_dir" ]]; then
  echo "Backup directory not found: $backup_dir"
  exit 1
fi

if [[ "${RESTORE_CONFIRM:-}" != "YES" ]]; then
  echo "Refusing to restore without RESTORE_CONFIRM=YES"
  exit 1
fi

if [[ ! -f "$backup_dir/postgres.sql" ]]; then
  echo "PostgreSQL dump not found: $backup_dir/postgres.sql"
  exit 1
fi

absolute_backup_dir="$(cd "$backup_dir" && pwd)"

restore_volume() {
  local volume_name="$1"
  local archive_name="$2"

  if [[ ! -f "$backup_dir/$archive_name" ]]; then
    echo "Skipping missing archive $backup_dir/$archive_name"
    return
  fi

  docker volume create "$volume_name" >/dev/null
  docker run --rm \
    -v "$volume_name:/to" \
    -v "$absolute_backup_dir:/backup:ro" \
    alpine:3.20 \
    sh -lc "rm -rf /to/* /to/.[!.]* /to/..?* && tar xzf /backup/$archive_name -C /to"
}

docker compose up -d postgres
docker compose exec -T postgres psql -U "$postgres_user" "$postgres_db" < "$backup_dir/postgres.sql"

restore_volume "${compose_project_name}_api-uploads" "api-uploads.tar.gz"
restore_volume "${compose_project_name}_minio-data" "minio-data.tar.gz"

echo "Restore complete from $backup_dir"
