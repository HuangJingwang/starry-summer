#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
web_dockerfile="$repo_root/apps/web/Dockerfile"

echo "Running Dockerfile tests"

web_runner_cmd="$(awk '
  /^FROM .* AS runner$/ { in_runner = 1; next }
  in_runner && /^CMD / { print; exit }
' "$web_dockerfile")"

if [[ "$web_runner_cmd" == *"--workspace"* || "$web_runner_cmd" == *'"npm"'* ]]; then
  echo "Web runner CMD must not depend on npm workspaces."
  echo "CMD: ${web_runner_cmd:-<missing>}"
  exit 1
fi

if [[ "$web_runner_cmd" != *'"node"'* || "$web_runner_cmd" != *'"apps/web/server.js"'* ]]; then
  echo "Web runner CMD must start the compiled Next standalone server directly."
  echo "CMD: ${web_runner_cmd:-<missing>}"
  exit 1
fi

web_runner_stage="$(awk '
  /^FROM .* AS runner$/ { in_runner = 1 }
  in_runner { print }
' "$web_dockerfile")"

for expected_path in 'apps/web/.next/static' 'apps/web/public'; do
  if [[ "$web_runner_stage" != *"$expected_path"* ]]; then
    echo "Web runner stage must copy $expected_path."
    exit 1
  fi
done

echo "Dockerfile tests passed"
