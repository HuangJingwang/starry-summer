#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
api_dockerfile="$repo_root/apps/api/Dockerfile"

echo "Running Dockerfile tests"

api_runner_cmd="$(awk '
  /^FROM .* AS runner$/ { in_runner = 1; next }
  in_runner && /^CMD / { print; exit }
' "$api_dockerfile")"

if [[ "$api_runner_cmd" == *"--workspace"* || "$api_runner_cmd" == *'"npm"'* ]]; then
  echo "API runner CMD must not depend on npm workspaces."
  echo "CMD: ${api_runner_cmd:-<missing>}"
  exit 1
fi

if [[ "$api_runner_cmd" != *'"node"'* || "$api_runner_cmd" != *'"apps/api/dist/apps/api/src/main.js"'* ]]; then
  echo "API runner CMD must start the compiled Nest entrypoint directly."
  echo "CMD: ${api_runner_cmd:-<missing>}"
  exit 1
fi

api_runner_stage="$(awk '
  /^FROM .* AS runner$/ { in_runner = 1 }
  in_runner { print }
' "$api_dockerfile")"

for package_name in shared markdown; do
  if [[ "$api_runner_stage" != *"packages/$package_name/package.json"* || "$api_runner_stage" != *"packages/$package_name/dist"* ]]; then
    echo "API runner stage must copy packages/$package_name package metadata and dist for workspace runtime imports."
    exit 1
  fi
done

echo "Dockerfile tests passed"
