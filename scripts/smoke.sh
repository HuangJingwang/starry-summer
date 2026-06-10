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

check_admin_protected_redirect() {
  local header_file="/tmp/starry-summer-smoke-headers"
  local status_code
  local location

  echo "Checking admin protected redirect: $SITE_URL/admin/content"
  status_code=$(curl --silent --show-error --output /dev/null --dump-header "$header_file" --write-out "%{http_code}" --max-time 10 "$SITE_URL/admin/content")
  location=$(awk 'tolower($1) == "location:" { sub(/\r$/, "", $0); sub(/^[^:]+:[[:space:]]*/, "", $0); print $0; exit }' "$header_file")
  rm -f "$header_file"

  if [[ "$status_code" != "307" && "$status_code" != "308" && "$status_code" != "302" && "$status_code" != "301" ]]; then
    echo "Admin protected route did not redirect. Status: $status_code"
    exit 1
  fi

  if [[ "$location" != /admin/login* && "$location" != "$SITE_URL/admin/login"* ]]; then
    echo "Location header did not point to /admin/login."
    echo "Location: ${location:-<missing>}"
    exit 1
  fi
}

check_health() {
  check_path "/health" "web health"

  if ! grep -q '"status":"ok"' "$response_file"; then
    echo "Health endpoint did not return status ok."
    cat "$response_file"
    exit 1
  fi
}

check_api_health() {
  check_path "/api/health" "API health"

  if ! grep -q '"service":"starry-summer-api"' "$response_file"; then
    echo "API health endpoint did not return the API service marker."
    cat "$response_file"
    exit 1
  fi

  if ! grep -q '"status":"ok"' "$response_file"; then
    echo "API health endpoint did not return status ok."
    cat "$response_file"
    exit 1
  fi
}

check_health
if [[ "${CHECK_API_HEALTH:-true}" == "true" ]]; then
  check_api_health
fi
check_path "/" "home page"
check_path "/admin/login" "admin login"
check_admin_protected_redirect
check_path "/rss.xml" "RSS feed"
check_path "/sitemap.xml" "sitemap"

echo "Smoke checks passed for $SITE_URL"
