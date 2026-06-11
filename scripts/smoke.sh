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

check_admin_api_protected() {
  local status_code

  echo "Checking admin API protected response: $SITE_URL/api/admin/content"
  status_code=$(curl --silent --show-error --output /dev/null --write-out "%{http_code}" --max-time 10 "$SITE_URL/api/admin/content")

  if [[ "$status_code" != "401" && "$status_code" != "403" ]]; then
    echo "Admin API endpoint did not reject unauthenticated access. Status: $status_code"
    exit 1
  fi
}

check_health() {
  check_path "/health" "web health"

  check_web_health_json
}

check_web_health_json() {
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

check_api_health_json() {
  node - "$response_file" <<'NODE'
const { readFileSync } = require('node:fs');

const responsePath = process.argv[2];
let data;

try {
  data = JSON.parse(readFileSync(responsePath, 'utf8'));
} catch {
  console.error('API health endpoint did not return the API service marker.');
  console.error(readFileSync(responsePath, 'utf8'));
  process.exit(1);
}

function fail(message) {
  console.error(message);
  console.error(JSON.stringify(data));
  process.exit(1);
}

if (data.service !== 'starry-summer-api') {
  fail('API health endpoint did not return the API service marker.');
}

if (data.status !== 'ok') {
  fail('API health endpoint did not return status ok.');
}

if (!data.release?.version || !data.release?.revision) {
  fail('API health endpoint did not return release metadata.');
}

if (data.components?.database?.status !== 'ok' || data.components?.database?.driver !== 'postgres') {
  fail('API health endpoint did not report PostgreSQL as healthy.');
}

if (data.components?.redis?.status !== 'ok' || data.components?.redis?.driver !== 'redis') {
  fail('API health endpoint did not report Redis as healthy.');
}
NODE
}

check_api_health() {
  check_path "/api/health" "API health"
  check_api_health_json
}

check_settings_api() {
  check_path "/api/settings" "settings API"

  node - "$response_file" <<'NODE'
const { readFileSync } = require('node:fs');

const responsePath = process.argv[2];
let data;

try {
  data = JSON.parse(readFileSync(responsePath, 'utf8'));
} catch {
  console.error('Settings API endpoint did not return JSON.');
  console.error(readFileSync(responsePath, 'utf8'));
  process.exit(1);
}

if (!data || typeof data !== 'object' || Array.isArray(data)) {
  console.error('Settings API endpoint did not return a JSON object.');
  console.error(JSON.stringify(data));
  process.exit(1);
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
if [[ "${CHECK_API_HEALTH:-true}" == "true" ]]; then
  check_api_health
fi
check_security_headers
check_path "/" "home page"
check_path "/admin/login" "admin login"
check_admin_protected_redirect
check_admin_api_protected
check_settings_api
check_rss
check_sitemap

echo "Smoke checks passed for $SITE_URL"
