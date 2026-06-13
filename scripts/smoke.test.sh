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
method="GET"
write_out=""
output_file=""
url=""
data=""

while [[ "$#" -gt 0 ]]; do
  case "$1" in
    --request | -X)
      method="$2"
      shift 2
      ;;
    --header | -H)
      shift 2
      ;;
    --data | --data-raw | --data-binary)
      data="$2"
      shift 2
      ;;
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

printf '%s %s\n' "$method" "$url" >>"${SMOKE_TEST_LOG:?}"

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
  */api/content\?type=post)
    if [[ -n "${FAKE_POST_CONTENT_BODY:-}" ]]; then
      emit_body "$FAKE_POST_CONTENT_BODY"
    else
      emit_body '[{"id":"11111111-1111-4111-8111-111111111111","type":"post","title":"Smoke post"}]'
    fi
    ;;
  */api/likes/post/11111111-1111-4111-8111-111111111111)
    if [[ -n "$write_out" ]]; then
      printf '%s' "${FAKE_LIKE_STATUS:-200}"
      exit 0
    else
      emit_body '{"count":1}'
    fi
    ;;
  */api/likes/post/smoke-post)
    if [[ -n "$write_out" ]]; then
      printf '%s' "${FAKE_LIKE_STATUS:-200}"
      exit 0
    else
      emit_body '{"count":1}'
    fi
    ;;
  */api/comments)
    if [[ -n "$write_out" ]]; then
      printf '%s' "${FAKE_COMMENT_SUBMIT_STATUS:-401}"
      exit 0
    else
      emit_body '{"message":"GitHub login is required to comment or leave a guestbook message","statusCode":401}'
    fi
    ;;
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
      emit_body '{"status":"ok","service":"starry-summer-api","release":{"version":"20260611091500","revision":"abc1234"},"components":{"api":{"status":"ok"},"database":{"status":"ok","driver":"postgres"},"redis":{"status":"ok","driver":"redis"},"storage":{"status":"ok","driver":"local"}}}'
    fi
    ;;
  */api/settings)
    if [[ -n "${FAKE_SETTINGS_BODY:-}" ]]; then
      emit_body "$FAKE_SETTINGS_BODY"
    else
      emit_body '{"profile":{"title":"Starry Summer","ownerName":"Aster.H","description":"Personal content platform","socialLinks":[]},"hero":{"tagline":"Personal archive","backgroundImageUrl":"/hero-workspace.png","motto":"Stay curious. Keep building.","quotes":["Stay curious. Keep building."]},"navigation":["search","posts","moments","projects","series","guestbook"],"updatedAt":"2026-06-10T00:00:00.000Z"}'
    fi
    ;;
  */api/content\?q=starry)
    emit_body "${FAKE_CONTENT_SEARCH_BODY:-[]}"
    ;;
  */api/guestbook)
    if [[ "$method" == "POST" ]]; then
      if [[ -n "$write_out" ]]; then
        printf '%s' "${FAKE_GUESTBOOK_SUBMIT_STATUS:-401}"
      else
        emit_body '{"message":"GitHub login is required to comment or leave a guestbook message","statusCode":401}'
      fi
      exit 0
    fi
    emit_body "${FAKE_GUESTBOOK_BODY:-[]}"
    ;;
  */api/comments/post/smoke-post)
    emit_body "${FAKE_COMMENTS_BODY:-[]}"
    ;;
  */api/comments/post/11111111-1111-4111-8111-111111111111)
    emit_body "${FAKE_COMMENTS_BODY:-[]}"
    ;;
  */api/assets/random\?usage=background)
    emit_body "${FAKE_RANDOM_ASSET_BODY:-null}"
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
export SMOKE_TEST_LOG="$tmp_dir/smoke-calls.log"
PATH="$tmp_dir:$PATH" bash "$repo_root/scripts/smoke.sh" "https://example.com"

if ! grep -q 'GET https://example.com/api/content?type=post' "$SMOKE_TEST_LOG"; then
  echo "Smoke script did not discover a real public post before checking likes."
  cat "$SMOKE_TEST_LOG"
  exit 1
fi

if ! grep -q 'GET https://example.com/api/comments/post/11111111-1111-4111-8111-111111111111' "$SMOKE_TEST_LOG"; then
  echo "Smoke script did not check comments against the discovered public post."
  cat "$SMOKE_TEST_LOG"
  exit 1
fi

if ! grep -q 'POST https://example.com/api/likes/post/11111111-1111-4111-8111-111111111111' "$SMOKE_TEST_LOG"; then
  echo "Smoke script did not check anonymous public like submission against the discovered post."
  cat "$SMOKE_TEST_LOG"
  exit 1
fi

if ! grep -q 'POST https://example.com/api/comments' "$SMOKE_TEST_LOG"; then
  echo "Smoke script did not check unauthenticated comment submission rejection."
  cat "$SMOKE_TEST_LOG"
  exit 1
fi

if ! grep -q 'POST https://example.com/api/guestbook' "$SMOKE_TEST_LOG"; then
  echo "Smoke script did not check unauthenticated guestbook submission rejection."
  cat "$SMOKE_TEST_LOG"
  exit 1
fi

PATH="$tmp_dir:$PATH" FAKE_API_HEALTH_BODY='{
  "components": {
    "redis": { "driver": "redis", "status": "ok" },
    "storage": { "driver": "local", "status": "ok" },
    "database": { "driver": "postgres", "status": "ok" },
    "api": { "status": "ok" }
  },
  "service": "starry-summer-api",
  "release": { "version": "20260611091500", "revision": "abc1234" },
  "status": "ok"
}' bash "$repo_root/scripts/smoke.sh" "https://example.com"

PATH="$tmp_dir:$PATH" FAKE_API_HEALTH_BODY='{
  "components": {
    "redis": { "driver": "redis", "status": "ok" },
    "storage": { "driver": "s3", "status": "ok" },
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

if PATH="$tmp_dir:$PATH" FAKE_API_HEALTH_BODY='{"status":"ok","service":"starry-summer-api","release":{"version":"20260611091500","revision":"abc1234"},"components":{"database":{"status":"ok","driver":"postgres"},"redis":{"status":"ok","driver":"redis"}}}' bash "$repo_root/scripts/smoke.sh" "https://example.com" >"$tmp_dir/missing-storage-health.log" 2>&1; then
  echo "Smoke script accepted missing storage health."
  cat "$tmp_dir/missing-storage-health.log"
  exit 1
fi

if PATH="$tmp_dir:$PATH" FAKE_API_HEALTH_BODY='{"status":"ok","service":"starry-summer-api","release":{"version":"20260611091500","revision":"abc1234"},"components":{"database":{"status":"ok","driver":"postgres"},"redis":{"status":"ok","driver":"redis"},"storage":{"status":"error","driver":"s3"}}}' bash "$repo_root/scripts/smoke.sh" "https://example.com" >"$tmp_dir/degraded-storage-health.log" 2>&1; then
  echo "Smoke script accepted degraded storage health."
  cat "$tmp_dir/degraded-storage-health.log"
  exit 1
fi

if PATH="$tmp_dir:$PATH" FAKE_API_HEALTH_BODY='{"status":"ok","service":"starry-summer-api","release":{"version":"20260611091500","revision":"abc1234"},"components":{"database":{"status":"ok","driver":"postgres"},"redis":{"status":"ok","driver":"redis"},"storage":{"status":"ok","driver":"ftp"}}}' bash "$repo_root/scripts/smoke.sh" "https://example.com" >"$tmp_dir/unknown-storage-health.log" 2>&1; then
  echo "Smoke script accepted unknown storage driver health."
  cat "$tmp_dir/unknown-storage-health.log"
  exit 1
fi

if PATH="$tmp_dir:$PATH" FAKE_API_HEALTH_BODY='{"status":"ok","service":"starry-summer-api","components":{"database":{"status":"ok","driver":"postgres"},"redis":{"status":"ok","driver":"redis"},"storage":{"status":"ok","driver":"local"}}}' bash "$repo_root/scripts/smoke.sh" "https://example.com" >"$tmp_dir/missing-api-release.log" 2>&1; then
  echo "Smoke script accepted missing API release metadata."
  cat "$tmp_dir/missing-api-release.log"
  exit 1
fi

if PATH="$tmp_dir:$PATH" FAKE_SETTINGS_BODY='<html>not json</html>' bash "$repo_root/scripts/smoke.sh" "https://example.com" >"$tmp_dir/non-json-settings.log" 2>&1; then
  echo "Smoke script accepted a non-JSON settings response."
  cat "$tmp_dir/non-json-settings.log"
  exit 1
fi

if PATH="$tmp_dir:$PATH" FAKE_SETTINGS_BODY='{"profile":{"ownerName":"Private Owner"}}' bash "$repo_root/scripts/smoke.sh" "https://example.com" >"$tmp_dir/private-owner-settings.log" 2>&1; then
  echo "Smoke script accepted a public settings response without the Aster.H owner alias."
  cat "$tmp_dir/private-owner-settings.log"
  exit 1
fi
if ! grep -q 'Settings API endpoint did not return the public owner alias.' "$tmp_dir/private-owner-settings.log"; then
  echo "Smoke script rejected private owner settings for the wrong reason."
  cat "$tmp_dir/private-owner-settings.log"
  exit 1
fi

if PATH="$tmp_dir:$PATH" FAKE_CONTENT_SEARCH_BODY='<html>not json</html>' bash "$repo_root/scripts/smoke.sh" "https://example.com" >"$tmp_dir/non-json-content-search.log" 2>&1; then
  echo "Smoke script accepted a non-JSON content search response."
  cat "$tmp_dir/non-json-content-search.log"
  exit 1
fi

if PATH="$tmp_dir:$PATH" FAKE_GUESTBOOK_BODY='<html>not json</html>' bash "$repo_root/scripts/smoke.sh" "https://example.com" >"$tmp_dir/non-json-guestbook.log" 2>&1; then
  echo "Smoke script accepted a non-JSON guestbook response."
  cat "$tmp_dir/non-json-guestbook.log"
  exit 1
fi

if PATH="$tmp_dir:$PATH" FAKE_COMMENTS_BODY='<html>not json</html>' bash "$repo_root/scripts/smoke.sh" "https://example.com" >"$tmp_dir/non-json-comments.log" 2>&1; then
  echo "Smoke script accepted a non-JSON comments response."
  cat "$tmp_dir/non-json-comments.log"
  exit 1
fi

if PATH="$tmp_dir:$PATH" FAKE_RANDOM_ASSET_BODY='<html>not json</html>' bash "$repo_root/scripts/smoke.sh" "https://example.com" >"$tmp_dir/non-json-random-asset.log" 2>&1; then
  echo "Smoke script accepted a non-JSON random asset response."
  cat "$tmp_dir/non-json-random-asset.log"
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
