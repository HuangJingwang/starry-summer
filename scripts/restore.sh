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

if [[ ! -f "$backup_dir/manifest.txt" ]]; then
  echo "Backup manifest not found: $backup_dir/manifest.txt"
  echo "Refusing to restore from a directory that does not look like a Starry Summer backup."
  exit 1
fi

backup_compose_project_name="$(awk -F= '$1 == "compose_project_name" { print $2; exit }' "$backup_dir/manifest.txt")"

if [[ -z "$backup_compose_project_name" ]]; then
  echo "Backup manifest does not include compose_project_name."
  echo "Refusing to restore from a manifest that cannot be matched to this Compose project."
  exit 1
fi

if [[ -n "$backup_compose_project_name" && "$backup_compose_project_name" != "$compose_project_name" && "${RESTORE_ALLOW_PROJECT_MISMATCH:-}" != "YES" ]]; then
  echo "Backup Compose project does not match the current Compose project."
  echo "Backup project: $backup_compose_project_name"
  echo "Current project: $compose_project_name"
  echo "Set RESTORE_ALLOW_PROJECT_MISMATCH=YES only if you intentionally want to restore across projects."
  exit 1
fi

absolute_backup_dir="$(cd "$backup_dir" && pwd)"

verify_archive() {
  local archive_name="$1"

  if [[ ! -f "$backup_dir/$archive_name" ]]; then
    return
  fi

  if ! LC_ALL=C tar tzf "$backup_dir/$archive_name" >/dev/null; then
    echo "Backup archive is not a valid tar.gz: $backup_dir/$archive_name"
    echo "Refusing to restore before touching PostgreSQL or Docker volumes."
    exit 1
  fi
}

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

verify_archive "api-uploads.tar.gz"
verify_archive "minio-data.tar.gz"

docker compose up -d postgres
docker compose exec -T postgres psql -v ON_ERROR_STOP=1 -U "$postgres_user" "$postgres_db" < "$backup_dir/postgres.sql"

restore_volume "${compose_project_name}_api-uploads" "api-uploads.tar.gz"
restore_volume "${compose_project_name}_minio-data" "minio-data.tar.gz"

echo "Restore complete from $backup_dir"
