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
    --output | --max-time)
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

case "$url" in
  */admin/content)
    printf 'HTTP/1.1 307 Temporary Redirect\r\nLocation: https://example.com/admin/login?next=%%2Fadmin%%2Fcontent\r\n\r\n' >"$header_file"
    printf '307'
    ;;
  */api/health)
    printf '%s' "${FAKE_API_HEALTH_BODY:-{\"status\":\"ok\",\"service\":\"starry-summer-api\"}}"
    ;;
  */health)
    printf '{"status":"ok"}'
    ;;
  */)
    printf '<html>home</html>'
    ;;
  */admin/login)
    printf '<html>login</html>'
    ;;
  */rss.xml)
    printf '%s' "${FAKE_RSS_BODY:-<rss version=\"2.0\"><channel><title>Starry Summer</title></channel></rss>}"
    ;;
  */sitemap.xml)
    printf '%s' "${FAKE_SITEMAP_BODY:-<urlset><url><loc>https://example.com</loc></url></urlset>}"
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
PATH="$tmp_dir:$PATH" bash "$repo_root/scripts/smoke.sh" "https://example.com"

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

echo "Smoke script tests passed"
