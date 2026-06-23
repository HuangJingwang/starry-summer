# Starry Summer Example

Use this reference when adapting the `codex-post-push-watcher` skill from the Starry Summer implementation.

## Files

- `.codex/hooks.json`: registers a `PostToolUse` hook for the Codex `Bash` tool.
- `.codex/hooks/post-git-push-check.mjs`: reads hook stdin JSON, detects a successful `git push`, resolves the repository context with Git, and starts the watcher.
- `scripts/ops/watch-pushed-deployment.mjs`: polls GitHub through `gh`, classifies CI/Vercel state, runs production smoke for `main`, writes JSONL, and sends best-effort macOS notifications.
- `scripts/ops/watch-pushed-deployment.test.mjs`: pure tests for summary classification and record shape.
- `.github/workflows/production-smoke.yml`: listens for Vercel `repository_dispatch` events.
- `docs/ops/codex-post-push-watcher.md`: human-facing explanation of the feature.

## Local Result Contract

Watcher output is appended to:

```text
.codex/local/post-push-status.jsonl
```

Each line is a JSON object with:

- `kind`: always `post-push-deployment-status`
- `createdAt`: ISO timestamp
- `branch`
- `sha`
- `state`: `pending`, `success`, or `failure`
- `pullRequest`: selected PR metadata or `null`
- `vercelChecks`
- `productionSmoke`
- `blockers`

The `.codex/local/` directory is ignored by Git.

## Dependencies

- Node.js 22+
- Git
- GitHub CLI authenticated as a user who can read the repository checks and PRs
- Optional macOS `osascript` notifications
- Vercel GitHub integration for Vercel checks and repository dispatch events

## Safety Boundaries

The Starry Summer watcher reports only. It must not:

- merge pull requests
- push commits
- modify Vercel settings
- edit GitHub secrets
- create or delete deployments
- hide failed checks

Automatic repair remains a separate automation concern.
