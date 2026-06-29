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

printf 'GET %s\n' "$url" >>"${SMOKE_TEST_LOG:?}"

if [[ -n "$header_file" ]]; then
  printf '%b' "${FAKE_SECURITY_HEADERS:-HTTP/1.1 200 OK\r\nStrict-Transport-Security: max-age=31536000; includeSubDomains; preload\r\nX-Content-Type-Options: nosniff\r\nX-Frame-Options: DENY\r\nReferrer-Policy: strict-origin-when-cross-origin\r\nPermissions-Policy: camera=(), microphone=(), geolocation=()\r\n\r\n}" >"$header_file"
fi

emit_body() {
  if [[ "$output_file" == "/dev/null" ]]; then
    return
  fi

  printf '%s' "$1"
}

case "$url" in
  */admin/content)
    emit_body '<html>admin content</html>'
    printf '200'
    ;;
  */health)
    emit_body "${FAKE_WEB_HEALTH_BODY:-{\"status\":\"ok\",\"service\":\"starry-summer-web\",\"release\":{\"version\":\"20260611091500\",\"revision\":\"abc1234\"}}}"
    ;;
  */)
    emit_body '<html>home</html>'
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

if [[ -n "$write_out" && "$url" != */admin/content ]]; then
  printf '%s' "$write_out"
fi
SH
chmod +x "$tmp_dir/curl"

echo "Running smoke script tests"
export SMOKE_TEST_LOG="$tmp_dir/smoke-calls.log"
PATH="$tmp_dir:$PATH" bash "$repo_root/scripts/smoke.sh" "https://example.com"

for expected_call in \
  'GET https://example.com/health' \
  'GET https://example.com/' \
  'GET https://example.com/admin/content' \
  'GET https://example.com/rss.xml' \
  'GET https://example.com/sitemap.xml'
do
  if ! grep -q "$expected_call" "$SMOKE_TEST_LOG"; then
    echo "Smoke script did not call expected route: $expected_call"
    cat "$SMOKE_TEST_LOG"
    exit 1
  fi
done

if grep -q '/api/health\|/api/content\|/api/settings\|/api/admin/content' "$SMOKE_TEST_LOG"; then
  echo "Smoke script still checks legacy API routes."
  cat "$SMOKE_TEST_LOG"
  exit 1
fi

if PATH="$tmp_dir:$PATH" FAKE_WEB_HEALTH_BODY='{"status":"ok","service":"starry-summer-web"}' bash "$repo_root/scripts/smoke.sh" "https://example.com" >"$tmp_dir/missing-web-release.log" 2>&1; then
  echo "Smoke script accepted missing web release metadata."
  cat "$tmp_dir/missing-web-release.log"
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

echo "Smoke script tests passed"
