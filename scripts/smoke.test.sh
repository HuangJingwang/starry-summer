#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
tmp_dir="$(mktemp -d)"

cleanup() {
  rm -rf "$tmp_dir"
}

trap cleanup EXIT

cat >"$tmp_dir/curl" <<'SH'
#!/usr/bin/env bash
set -euo pipefail

header_file=""
write_out=""
output_file=""
url=""

while [[ "$#" -gt 0 ]]; do
  case "$1" in
    --dump-header)
      header_file="$2"
      shift 2
      ;;
    --write-out)
      write_out="$2"
      shift 2
      ;;
    --output)
      output_file="$2"
      shift 2
      ;;
    --max-time)
      shift 2
      ;;
    --fail | --silent | --show-error | --location)
      shift
      ;;
    *)
      url="$1"
      shift
      ;;
  esac
done

if [[ -n "$header_file" && "$url" != */admin/content ]]; then
  printf '%b' "${FAKE_SECURITY_HEADERS:-HTTP/1.1 200 OK\r\nStrict-Transport-Security: max-age=31536000; includeSubDomains; preload\r\nX-Content-Type-Options: nosniff\r\nX-Frame-Options: DENY\r\nReferrer-Policy: strict-origin-when-cross-origin\r\nPermissions-Policy: camera=(), microphone=(), geolocation=()\r\n\r\n}" >"$header_file"
fi

emit_body() {
  if [[ "$output_file" == "/dev/null" ]]; then
    return
  fi

  printf '%s' "$1"
}

case "$url" in
  */api/admin/content)
    if [[ -n "$write_out" ]]; then
      printf '%s' "${FAKE_ADMIN_API_STATUS:-401}"
    else
      emit_body '{"message":"Unauthorized","statusCode":401}'
    fi
    ;;
  */admin/content)
    printf 'HTTP/1.1 307 Temporary Redirect\r\nLocation: https://example.com/admin/login?next=%%2Fadmin%%2Fcontent\r\n\r\n' >"$header_file"
    printf '307'
    ;;
  */api/health)
    if [[ -n "${FAKE_API_HEALTH_BODY:-}" ]]; then
      emit_body "$FAKE_API_HEALTH_BODY"
    else
      emit_body '{"status":"ok","service":"starry-summer-api","release":{"version":"20260611091500","revision":"abc1234"},"components":{"api":{"status":"ok"},"database":{"status":"ok","driver":"postgres"},"redis":{"status":"ok","driver":"redis"}}}'
    fi
    ;;
  */health)
    emit_body "${FAKE_WEB_HEALTH_BODY:-{\"status\":\"ok\",\"service\":\"starry-summer-web\",\"release\":{\"version\":\"20260611091500\",\"revision\":\"abc1234\"}}}"
    ;;
  */)
    emit_body '<html>home</html>'
    ;;
  */admin/login)
    emit_body '<html>login</html>'
    ;;
  */rss.xml)
    emit_body "${FAKE_RSS_BODY:-<rss version=\"2.0\"><channel><title>Starry Summer</title></channel></rss>}"
    ;;
  */sitemap.xml)
    emit_body "${FAKE_SITEMAP_BODY:-<urlset><url><loc>https://example.com</loc></url></urlset>}"
    ;;
  *)
    printf 'unexpected URL: %s\n' "$url" >&2
    exit 1
    ;;
esac

if [[ -n "$write_out" && "$url" != */admin/content && "$url" != */api/admin/content ]]; then
  printf '%s' "$write_out"
fi
SH
chmod +x "$tmp_dir/curl"

echo "Running smoke script tests"
PATH="$tmp_dir:$PATH" bash "$repo_root/scripts/smoke.sh" "https://example.com"

PATH="$tmp_dir:$PATH" FAKE_API_HEALTH_BODY='{
  "components": {
    "redis": { "driver": "redis", "status": "ok" },
    "database": { "driver": "postgres", "status": "ok" },
    "api": { "status": "ok" }
  },
  "service": "starry-summer-api",
  "release": { "version": "20260611091500", "revision": "abc1234" },
  "status": "ok"
}' bash "$repo_root/scripts/smoke.sh" "https://example.com"

if PATH="$tmp_dir:$PATH" FAKE_WEB_HEALTH_BODY='{"status":"ok","service":"starry-summer-web"}' bash "$repo_root/scripts/smoke.sh" "https://example.com" >"$tmp_dir/missing-web-release.log" 2>&1; then
  echo "Smoke script accepted missing web release metadata."
  cat "$tmp_dir/missing-web-release.log"
  exit 1
fi

if PATH="$tmp_dir:$PATH" FAKE_API_HEALTH_BODY='<html>web</html>' bash "$repo_root/scripts/smoke.sh" "https://example.com" >"$tmp_dir/unexpected-api-health.log" 2>&1; then
  echo "Smoke script accepted a non-API health response."
  cat "$tmp_dir/unexpected-api-health.log"
  exit 1
fi

if PATH="$tmp_dir:$PATH" FAKE_API_HEALTH_BODY='{"status":"degraded","service":"starry-summer-api"}' bash "$repo_root/scripts/smoke.sh" "https://example.com" >"$tmp_dir/degraded-api-health.log" 2>&1; then
  echo "Smoke script accepted a degraded API health response."
  cat "$tmp_dir/degraded-api-health.log"
  exit 1
fi

if PATH="$tmp_dir:$PATH" FAKE_API_HEALTH_BODY='{"status":"ok","service":"starry-summer-api","components":{"database":{"status":"skipped","driver":"memory"}}}' bash "$repo_root/scripts/smoke.sh" "https://example.com" >"$tmp_dir/non-persistent-api-health.log" 2>&1; then
  echo "Smoke script accepted a non-persistent API health response."
  cat "$tmp_dir/non-persistent-api-health.log"
  exit 1
fi

if PATH="$tmp_dir:$PATH" FAKE_API_HEALTH_BODY='{"status":"ok","service":"starry-summer-api","components":{"database":{"status":"ok","driver":"postgres"}}}' bash "$repo_root/scripts/smoke.sh" "https://example.com" >"$tmp_dir/missing-redis-health.log" 2>&1; then
  echo "Smoke script accepted missing Redis health."
  cat "$tmp_dir/missing-redis-health.log"
  exit 1
fi

if PATH="$tmp_dir:$PATH" FAKE_API_HEALTH_BODY='{"status":"ok","service":"starry-summer-api","components":{"database":{"status":"ok","driver":"postgres"},"redis":{"status":"ok","driver":"redis"}}}' bash "$repo_root/scripts/smoke.sh" "https://example.com" >"$tmp_dir/missing-api-release.log" 2>&1; then
  echo "Smoke script accepted missing API release metadata."
  cat "$tmp_dir/missing-api-release.log"
  exit 1
fi

if PATH="$tmp_dir:$PATH" FAKE_RSS_BODY='<html>not rss</html>' bash "$repo_root/scripts/smoke.sh" "https://example.com" >"$tmp_dir/unexpected-rss.log" 2>&1; then
  echo "Smoke script accepted a non-RSS response."
  cat "$tmp_dir/unexpected-rss.log"
  exit 1
fi

if PATH="$tmp_dir:$PATH" FAKE_SITEMAP_BODY='<html>not sitemap</html>' bash "$repo_root/scripts/smoke.sh" "https://example.com" >"$tmp_dir/unexpected-sitemap.log" 2>&1; then
  echo "Smoke script accepted a non-sitemap response."
  cat "$tmp_dir/unexpected-sitemap.log"
  exit 1
fi

if PATH="$tmp_dir:$PATH" FAKE_SECURITY_HEADERS=$'HTTP/1.1 200 OK\r\nX-Frame-Options: DENY\r\n\r\n' bash "$repo_root/scripts/smoke.sh" "https://example.com" >"$tmp_dir/missing-security-headers.log" 2>&1; then
  echo "Smoke script accepted missing security headers."
  cat "$tmp_dir/missing-security-headers.log"
  exit 1
fi

if PATH="$tmp_dir:$PATH" FAKE_ADMIN_API_STATUS=200 bash "$repo_root/scripts/smoke.sh" "https://example.com" >"$tmp_dir/unprotected-admin-api.log" 2>&1; then
  echo "Smoke script accepted an unprotected admin API endpoint."
  cat "$tmp_dir/unprotected-admin-api.log"
  exit 1
fi

echo "Smoke script tests passed"
