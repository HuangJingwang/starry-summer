#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

backup_dir="${1:-}"
content_target_path="${RESTORE_CONTENT_DIR:-apps/web/content}"
images_target_path="${RESTORE_IMAGES_DIR:-apps/web/public/images}"

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

  echo "sha256sum or shasum is required to verify backup checksums." >&2
  exit 1
}

if [[ -z "$backup_dir" ]]; then
  echo "Usage: RESTORE_CONFIRM=YES npm run ops:restore -- backups/starry-summer-static-YYYY-MM-DD"
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

if [[ ! -f "$backup_dir/manifest.txt" ]]; then
  echo "Backup manifest not found: $backup_dir/manifest.txt"
  echo "Refusing to restore from a directory that does not look like a Starry Summer static backup."
  exit 1
fi

manifest_value() {
  local key="$1"

  awk -F= -v key="$key" '$1 == key { print $2; exit }' "$backup_dir/manifest.txt"
}

verify_archive() {
  local archive_name="$1"

  if [[ ! -f "$backup_dir/$archive_name" ]]; then
    return
  fi

  if ! LC_ALL=C tar tzf "$backup_dir/$archive_name" >/dev/null; then
    echo "Backup archive is not a valid tar.gz: $backup_dir/$archive_name"
    exit 1
  fi
}

verify_manifest_checksum() {
  local manifest_key="$1"
  local file_path="$2"
  local expected_checksum
  local actual_checksum

  expected_checksum="$(manifest_value "$manifest_key")"

  if [[ -z "$expected_checksum" || ! -f "$file_path" ]]; then
    return
  fi

  actual_checksum="$(sha256_file "$file_path")"

  if [[ "$actual_checksum" != "$expected_checksum" ]]; then
    echo "Backup checksum does not match: $file_path"
    echo "Expected: $expected_checksum"
    echo "Actual: $actual_checksum"
    exit 1
  fi
}

restore_archive() {
  local archive_name="$1"
  local target_path="$2"

  if [[ ! -f "$backup_dir/$archive_name" ]]; then
    echo "Skipping missing archive $backup_dir/$archive_name"
    return
  fi

  mkdir -p "$target_path"
  find "$target_path" -mindepth 1 -maxdepth 1 -exec rm -rf {} +
  tar xzf "$backup_dir/$archive_name" -C "$target_path"
}

verify_archive "web-content.tar.gz"
verify_archive "public-images.tar.gz"
verify_manifest_checksum "web_content_sha256" "$backup_dir/web-content.tar.gz"
verify_manifest_checksum "public_images_sha256" "$backup_dir/public-images.tar.gz"

restore_archive "web-content.tar.gz" "$content_target_path"
restore_archive "public-images.tar.gz" "$images_target_path"

echo "Restore complete from $backup_dir"
