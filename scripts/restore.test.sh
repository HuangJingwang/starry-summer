#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
tmp_dir="$(mktemp -d)"

cleanup() {
  rm -rf "$tmp_dir"
}

trap cleanup EXIT

backup_dir="$tmp_dir/backup"
missing_manifest_dir="$tmp_dir/missing-manifest"
corrupt_archive_dir="$tmp_dir/corrupt-archive"
tampered_checksum_dir="$tmp_dir/tampered-checksum"
restore_content_dir="$tmp_dir/restore-content"
restore_images_dir="$tmp_dir/restore-images"
mkdir -p "$backup_dir" "$missing_manifest_dir" "$corrupt_archive_dir" "$tampered_checksum_dir"
mkdir -p "$tmp_dir/content-source" "$tmp_dir/image-source"
printf '%s\n' '{"items":[]}' >"$tmp_dir/content-source/public-content.json"
printf '%s\n' 'fake image' >"$tmp_dir/image-source/profile.txt"
LC_ALL=C tar czf "$backup_dir/web-content.tar.gz" -C "$tmp_dir/content-source" .
LC_ALL=C tar czf "$backup_dir/public-images.tar.gz" -C "$tmp_dir/image-source" .
web_content_sha="$(sha256sum "$backup_dir/web-content.tar.gz" | awk '{ print $1 }')"
public_images_sha="$(sha256sum "$backup_dir/public-images.tar.gz" | awk '{ print $1 }')"
printf '%s\n' \
  'created_at=2026-06-11-093300' \
  "web_content_sha256=$web_content_sha" \
  "public_images_sha256=$public_images_sha" \
  'git_revision=abc1234' \
  >"$backup_dir/manifest.txt"
printf '%s\n' 'not a gzip archive' >"$corrupt_archive_dir/web-content.tar.gz"
printf '%s\n' 'created_at=2026-06-11-093300' >"$corrupt_archive_dir/manifest.txt"
cp "$backup_dir/web-content.tar.gz" "$tampered_checksum_dir/web-content.tar.gz"
printf '%s\n' \
  'created_at=2026-06-11-093300' \
  'web_content_sha256=0000000000000000000000000000000000000000000000000000000000000000' \
  >"$tampered_checksum_dir/manifest.txt"

echo "Running restore script tests"

if RESTORE_CONFIRM=YES bash "$repo_root/scripts/restore.sh" "$missing_manifest_dir" >"$tmp_dir/missing-manifest.log" 2>&1; then
  echo "Restore script accepted a directory without a manifest."
  cat "$tmp_dir/missing-manifest.log"
  exit 1
fi

if ! grep -q 'Backup manifest not found' "$tmp_dir/missing-manifest.log"; then
  echo "Restore script did not explain missing manifest refusal."
  cat "$tmp_dir/missing-manifest.log"
  exit 1
fi

if RESTORE_CONFIRM=YES bash "$repo_root/scripts/restore.sh" "$corrupt_archive_dir" >"$tmp_dir/corrupt-archive.log" 2>&1; then
  echo "Restore script accepted a corrupt backup archive."
  cat "$tmp_dir/corrupt-archive.log"
  exit 1
fi

if ! grep -q 'Backup archive is not a valid tar.gz' "$tmp_dir/corrupt-archive.log"; then
  echo "Restore script did not explain corrupt archive refusal."
  cat "$tmp_dir/corrupt-archive.log"
  exit 1
fi

if RESTORE_CONFIRM=YES bash "$repo_root/scripts/restore.sh" "$tampered_checksum_dir" >"$tmp_dir/tampered-checksum.log" 2>&1; then
  echo "Restore script accepted a backup with a mismatched checksum."
  cat "$tmp_dir/tampered-checksum.log"
  exit 1
fi

if ! grep -q 'Backup checksum does not match' "$tmp_dir/tampered-checksum.log"; then
  echo "Restore script did not explain checksum mismatch refusal."
  cat "$tmp_dir/tampered-checksum.log"
  exit 1
fi

RESTORE_CONFIRM=YES \
RESTORE_CONTENT_DIR="$restore_content_dir" \
RESTORE_IMAGES_DIR="$restore_images_dir" \
bash "$repo_root/scripts/restore.sh" "$backup_dir"

if ! grep -Fq '{"items":[]}' "$restore_content_dir/public-content.json"; then
  echo "Restore script did not restore web content to the target directory."
  find "$restore_content_dir" -maxdepth 2 -type f -print
  exit 1
fi

if ! grep -q 'fake image' "$restore_images_dir/profile.txt"; then
  echo "Restore script did not restore public images to the target directory."
  find "$restore_images_dir" -maxdepth 2 -type f -print
  exit 1
fi

if grep -q 'docker\|postgres\|psql' "$repo_root/scripts/restore.sh"; then
  echo "Restore script still contains Docker or PostgreSQL restore commands."
  exit 1
fi

echo "Restore script tests passed"
