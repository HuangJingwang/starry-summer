#!/usr/bin/env bash
set -euo pipefail

SITE_URL="${1:-${SITE_URL:-http://127.0.0.1:3000}}"
SITE_URL="${SITE_URL%/}"
response_file="/tmp/starry-summer-smoke-response"

trap 'rm -f "$response_file"' EXIT

check_path() {
  local path="$1"
  local label="$2"

  echo "Checking $label: $SITE_URL$path"
  curl --fail --silent --show-error --location --max-time 10 "$SITE_URL$path" >"$response_file"
}

check_health() {
  check_path "/health" "web health"

  if ! grep -q '"status":"ok"' "$response_file"; then
    echo "Health endpoint did not return status ok."
    cat "$response_file"
    exit 1
  fi
}

check_health
if [[ "${CHECK_API_HEALTH:-true}" == "true" ]]; then
  check_path "/api/health" "API health"
fi
check_path "/" "home page"
check_path "/admin/login" "admin login"
check_path "/rss.xml" "RSS feed"
check_path "/sitemap.xml" "sitemap"

echo "Smoke checks passed for $SITE_URL"
