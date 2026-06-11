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

  if ! grep -q '"database":{"status":"ok","driver":"postgres"}' "$response_file"; then
    echo "API health endpoint did not report PostgreSQL as healthy."
    cat "$response_file"
    exit 1
  fi

  if ! grep -q '"redis":{"status":"ok","driver":"redis"}' "$response_file"; then
    echo "API health endpoint did not report Redis as healthy."
    cat "$response_file"
    exit 1
  fi
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
check_rss
check_sitemap

echo "Smoke checks passed for $SITE_URL"
