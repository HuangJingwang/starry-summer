#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

timestamp="$(date +%F-%H%M%S)"
backup_dir="${1:-backups/starry-summer-static-$timestamp}"

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

backup_path() {
  local source_path="$1"
  local archive_name="$2"

  if [[ ! -d "$source_path" ]]; then
    echo "Skipping missing path: $source_path"
    return
  fi

  tar czf "$backup_dir/$archive_name" -C "$source_path" .
}

echo "Writing static backup to $backup_dir"

backup_path "apps/web/content" "web-content.tar.gz"
backup_path "apps/web/public/images" "public-images.tar.gz"

{
  echo "created_at=$timestamp"
  if [[ -f "$backup_dir/web-content.tar.gz" ]]; then
    echo "web_content_sha256=$(sha256_file "$backup_dir/web-content.tar.gz")"
  fi
  if [[ -f "$backup_dir/public-images.tar.gz" ]]; then
    echo "public_images_sha256=$(sha256_file "$backup_dir/public-images.tar.gz")"
  fi
  git rev-parse --short HEAD 2>/dev/null | sed 's/^/git_revision=/'
} >"$backup_dir/manifest.txt"

echo "Backup complete: $backup_dir"
