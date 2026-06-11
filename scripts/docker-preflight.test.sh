#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
tmp_dir="$(mktemp -d)"

cleanup() {
  rm -rf "$tmp_dir"
}

trap cleanup EXIT

cat >"$tmp_dir/docker" <<'SH'
#!/usr/bin/env bash
set -euo pipefail

printf '%s\n' "$*" >>"${DOCKER_PREFLIGHT_TEST_LOG:?}"

if [[ "$1" == "--version" ]]; then
  echo "Docker version 28.3.2, build test"
  exit 0
fi

if [[ "$1" == "compose" && "$2" == "version" ]]; then
  echo "Docker Compose version v2.38.2"
  exit 0
fi

if [[ "$1" == "compose" && "$2" == "config" && "$3" == "--quiet" ]]; then
  exit 0
fi

if [[ "$1" == "image" && "$2" == "inspect" ]]; then
  exit 1
fi

if [[ "$1" == "pull" ]]; then
  if [[ "$2" == "node:22-alpine" ]]; then
    echo 'Error response from daemon: Get "https://registry-1.docker.io/v2/": EOF' >&2
    exit 1
  fi

  exit 0
fi

printf 'unexpected docker invocation: %s\n' "$*" >&2
exit 1
SH
chmod +x "$tmp_dir/docker"

export DOCKER_PREFLIGHT_TEST_LOG="$tmp_dir/docker.log"

echo "Running Docker preflight tests"

if PATH="$tmp_dir:$PATH" bash "$repo_root/scripts/docker-preflight.sh" >"$tmp_dir/preflight.log" 2>&1; then
  echo "Docker preflight accepted an unreachable base image."
  cat "$tmp_dir/preflight.log"
  exit 1
fi

if ! grep -q 'Docker image is not available: node:22-alpine' "$tmp_dir/preflight.log"; then
  echo "Docker preflight did not explain the unreachable image."
  cat "$tmp_dir/preflight.log"
  exit 1
fi

if ! grep -q 'Check Docker Hub access or configure a registry mirror' "$tmp_dir/preflight.log"; then
  echo "Docker preflight did not suggest the registry mirror fix."
  cat "$tmp_dir/preflight.log"
  exit 1
fi

if ! grep -q 'compose config --quiet' "$DOCKER_PREFLIGHT_TEST_LOG"; then
  echo "Docker preflight did not validate Compose config."
  cat "$DOCKER_PREFLIGHT_TEST_LOG"
  exit 1
fi

echo "Docker preflight tests passed"
