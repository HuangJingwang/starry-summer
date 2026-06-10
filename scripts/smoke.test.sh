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
    printf '<rss></rss>'
    ;;
  */sitemap.xml)
    printf '<urlset></urlset>'
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
PATH="$tmp_dir:$PATH" CHECK_API_HEALTH=false bash "$repo_root/scripts/smoke.sh" "https://example.com"
echo "Smoke script tests passed"
