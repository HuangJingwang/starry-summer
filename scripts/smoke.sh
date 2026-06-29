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

check_admin_static_workspace() {
  local header_file="/tmp/starry-summer-smoke-headers"
  local status_code

  echo "Checking admin static workspace: $SITE_URL/admin/content"
  status_code=$(curl --silent --show-error --output /dev/null --dump-header "$header_file" --write-out "%{http_code}" --max-time 10 "$SITE_URL/admin/content")
  rm -f "$header_file"

  if [[ "$status_code" != "200" ]]; then
    echo "Admin static route did not return 200. Status: $status_code"
    exit 1
  fi
}

check_health() {
  check_path "/health" "web health"

  node - "$response_file" <<'NODE'
const { readFileSync } = require('node:fs');

const responsePath = process.argv[2];
let data;

try {
  data = JSON.parse(readFileSync(responsePath, 'utf8'));
} catch {
  console.error('Web health endpoint did not return JSON.');
  console.error(readFileSync(responsePath, 'utf8'));
  process.exit(1);
}

function fail(message) {
  console.error(message);
  console.error(JSON.stringify(data));
  process.exit(1);
}

if (data.service !== 'starry-summer-web') {
  fail('Web health endpoint did not return the web service marker.');
}

if (data.status !== 'ok') {
  fail('Web health endpoint did not return status ok.');
}

if (!data.release?.version || !data.release?.revision) {
  fail('Web health endpoint did not return release metadata.');
}
NODE
}

check_rss() {
  check_path "/rss.xml" "RSS feed"

  if ! grep -q '<rss' "$response_file" || ! grep -q '<channel>' "$response_file"; then
    echo "RSS endpoint did not return an RSS channel."
    cat "$response_file"
    exit 1
  fi
}

check_sitemap() {
  check_path "/sitemap.xml" "sitemap"

  if ! grep -q '<urlset' "$response_file" || ! grep -q '<loc>' "$response_file"; then
    echo "Sitemap endpoint did not return URL entries."
    cat "$response_file"
    exit 1
  fi
}

require_header() {
  local header_file="$1"
  local header_name="$2"
  local expected_value="$3"

  if ! awk -v name="$header_name" -v expected="$expected_value" '
    BEGIN { found = 0 }
    {
      line = $0
      sub(/\r$/, "", line)
      split(line, parts, ":")
      header = tolower(parts[1])
      value = line
      sub(/^[^:]+:[[:space:]]*/, "", value)
      if (header == tolower(name) && index(value, expected) > 0) {
        found = 1
      }
    }
    END { exit found ? 0 : 1 }
  ' "$header_file"; then
    echo "Missing or invalid security header: $header_name"
    cat "$header_file"
    exit 1
  fi
}

check_security_headers() {
  local header_file="/tmp/starry-summer-smoke-security-headers"

  echo "Checking security headers: $SITE_URL/"
  curl --fail --silent --show-error --dump-header "$header_file" --output /dev/null --max-time 10 "$SITE_URL/"

  require_header "$header_file" "Strict-Transport-Security" "max-age=31536000"
  require_header "$header_file" "X-Content-Type-Options" "nosniff"
  require_header "$header_file" "X-Frame-Options" "DENY"
  require_header "$header_file" "Referrer-Policy" "strict-origin-when-cross-origin"
  require_header "$header_file" "Permissions-Policy" "camera=(), microphone=(), geolocation=()"

  rm -f "$header_file"
}

check_health
check_security_headers
check_path "/" "home page"
check_admin_static_workspace
check_rss
check_sitemap

echo "Smoke checks passed for $SITE_URL"
