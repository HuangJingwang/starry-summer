#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
tmp_dir="$(mktemp -d)"

cleanup() {
  rm -f "$repo_root/apps/web/content/backup-test-public-content.json"
  rm -f "$repo_root/apps/web/public/images/backup-test-image.txt"
  rm -rf "$tmp_dir"
}

trap cleanup EXIT

backup_dir="$tmp_dir/backup"
existing_backup_dir="$tmp_dir/existing-backup"

echo "Running backup script tests"

mkdir -p "$existing_backup_dir"
printf '%s\n' 'old backup marker' >"$existing_backup_dir/manifest.txt"

if bash "$repo_root/scripts/backup.sh" "$existing_backup_dir" >"$tmp_dir/existing-backup.log" 2>&1; then
  echo "Backup script accepted an existing backup directory."
  cat "$tmp_dir/existing-backup.log"
  exit 1
fi

if ! grep -q 'Backup directory already exists' "$tmp_dir/existing-backup.log"; then
  echo "Backup script did not explain existing backup directory refusal."
  cat "$tmp_dir/existing-backup.log"
  exit 1
fi

(
  cd "$repo_root"
  mkdir -p apps/web/content apps/web/public/images
  printf '%s\n' '{"items":[]}' >apps/web/content/backup-test-public-content.json
  printf '%s\n' 'fake image' >apps/web/public/images/backup-test-image.txt
  bash scripts/backup.sh "$backup_dir"
)

if [[ ! -f "$backup_dir/web-content.tar.gz" ]]; then
  echo "Backup script did not archive web content."
  find "$backup_dir" -maxdepth 1 -type f -print
  exit 1
fi

if [[ ! -f "$backup_dir/public-images.tar.gz" ]]; then
  echo "Backup script did not archive public images."
  find "$backup_dir" -maxdepth 1 -type f -print
  exit 1
fi

if ! grep -q '^web_content_sha256=' "$backup_dir/manifest.txt"; then
  echo "Expected backup manifest to include a web content checksum."
  cat "$backup_dir/manifest.txt"
  exit 1
fi

if ! grep -q '^public_images_sha256=' "$backup_dir/manifest.txt"; then
  echo "Expected backup manifest to include a public images checksum."
  cat "$backup_dir/manifest.txt"
  exit 1
fi

if ! LC_ALL=C tar tzf "$backup_dir/web-content.tar.gz" | grep -q 'backup-test-public-content.json'; then
  echo "Expected web content archive to include backup-test-public-content.json."
  exit 1
fi

if ! LC_ALL=C tar tzf "$backup_dir/public-images.tar.gz" | grep -q 'backup-test-image.txt'; then
  echo "Expected public images archive to include backup-test-image.txt."
  exit 1
fi

echo "Backup script tests passed"
