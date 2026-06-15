#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

required_images=(
  "node:22-alpine"
  "caddy:2.10-alpine"
)

echo "Checking Docker CLI"
docker --version >/dev/null

echo "Checking Docker Compose"
docker compose version >/dev/null

echo "Checking Docker Compose configuration"
docker compose config --quiet

for image in "${required_images[@]}"; do
  echo "Checking Docker image: $image"

  if docker image inspect "$image" >/dev/null 2>&1; then
    continue
  fi

  if docker pull "$image" >/dev/null; then
    continue
  fi

  echo "Docker image is not available: $image"
  echo "Check Docker Hub access or configure a registry mirror, then rerun this preflight."
  exit 1
done

echo "Docker preflight checks passed"
