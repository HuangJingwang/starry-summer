---
name: codex-post-push-watcher
description: Use when adding, adapting, reviewing, documenting, onboarding, or restoring on a new PC a local Codex post-push watcher that detects successful Codex-run git push commands, starts a short-lived local watcher, reads GitHub PR/check/status data with gh, follows Vercel deployment checks or repository_dispatch events, records local JSONL status, and avoids OpenAI API-key based GitHub Actions automation. Also use when an AI agent needs to understand how this repository's local push-to-deploy feedback loop works.
---

# Codex Post-Push Watcher

## Purpose

Build an event-driven local feedback loop for Codex users who push from local Codex sessions and want to know what happened to CI, PR mergeability, and Vercel deployments without running an always-on cron job or exposing their machine to inbound webhooks.

Prefer this pattern when the user has ChatGPT/Codex product access but not an OpenAI API key for `openai/codex-action`, or when local session continuity matters more than hosted automation.

## Architecture

Use this shape unless the target repository already has a stronger local automation pattern:

```text
Codex Bash tool runs git push
  -> Codex PostToolUse hook receives tool_input.command and tool_response
  -> hook validates that the command was a successful git push
  -> hook spawns a detached local watcher and exits quickly
  -> watcher queries GitHub with gh for PR/check/status data
  -> watcher records terminal results in .codex/local/post-push-status.jsonl
  -> optional GitHub Actions repository_dispatch handles Vercel deployment success/failure
```

The hook is a launcher. Keep all polling, PR logic, smoke checks, and notification behavior in a separate ops script that can be tested directly.

## Agent Handoff Quick Start

When this skill triggers inside an existing repository, first inspect these files if they exist:

```text
.codex/hooks.json
.codex/hooks/post-git-push-check.mjs
scripts/ops/watch-pushed-deployment.mjs
docs/ops/codex-post-push-watcher.md
```

Then decide whether the user is asking for:

- **Use/restore on this machine**: verify local prerequisites, do not rewrite the implementation.
- **Adapt to another repository**: copy the architecture, then adjust commands, production URL, GitHub workflow names, and smoke checks.
- **Debug after push**: read `.codex/local/post-push-status.jsonl`, then query GitHub with `gh` for the branch/SHA.
- **Improve the automation**: add tests before changing hook parsing, watcher classification, GitHub API calls, or status JSON shape.

For a new PC or fresh clone, the required setup is:

```bash
npm install
gh auth status
node .codex/hooks/post-git-push-check.test.mjs
node scripts/ops/watch-pushed-deployment.test.mjs
```

If `gh auth status` fails, ask the user to run `gh auth login`. If Codex has not trusted repo-local hooks, tell the user to trust `.codex/hooks.json` in Codex before expecting automatic post-push checks.

## Required Files

For a Node-based repository, create or adapt these files:

- `.codex/hooks.json`: repo-local Codex `PostToolUse` hook matching `Bash`.
- `.codex/hooks/post-git-push-check.mjs`: reads hook JSON from stdin, detects successful `git push`, resolves branch/SHA/repository, and starts the watcher.
- `scripts/ops/watch-pushed-deployment.mjs`: queries GitHub through `gh`, summarizes PR/check/Vercel state, writes JSONL, and optionally notifies locally.
- `scripts/ops/watch-pushed-deployment.test.mjs`: tests check normalization, Vercel status classification, repository parsing, and JSONL record shape.
- `.gitignore`: ignores `.codex/local/`.
- Optional `.github/workflows/production-smoke.yml`: handles Vercel `repository_dispatch` events and runs smoke checks on `vercel.deployment.success`.

Use the Starry Summer implementation as the concrete example. Read `references/starry-summer-example.md` when adapting the pattern from this repository.

## Hook Rules

- Match only `PostToolUse` for `Bash`.
- Treat `tool_input.command` as the command source.
- Treat `tool_response.exit_code`, `tool_response.exitCode`, or equivalent status fields as best-effort success evidence.
- Ignore failed `git push` commands.
- Do not block the Codex turn while waiting for CI or deployment; spawn the watcher detached.
- Write only local status artifacts under `.codex/local/`.
- Expect the user to trust repo-local hooks in Codex before they run.

## Watcher Rules

- Use `gh pr list --head <branch>` to find a related PR when one exists.
- Use PR `statusCheckRollup` first; fall back to commit check-runs and statuses by SHA.
- Classify Vercel checks by names or contexts containing `Vercel`.
- Treat pending Vercel/CI checks as non-terminal.
- Treat failed checks, merge conflicts, draft PRs, or failed production smoke as terminal failure.
- On `main`, run a production smoke check only after checks are successful.
- Do not merge PRs, push commits, change Vercel settings, edit secrets, or rerun external deployments from the watcher.

## GitHub Actions Vercel Events

When Vercel is connected to GitHub, prefer GitHub as the state relay. Add `repository_dispatch` support for:

- `vercel.deployment.success`: install dependencies and run the repository smoke check.
- `vercel.deployment.error`: fail the workflow with deployment evidence.
- `vercel.deployment.failed`: fail the workflow with deployment evidence.

Keep a low-frequency scheduled smoke check if the site needs drift detection outside fresh deployments.

## Verification

Follow TDD for new watcher behavior:

```bash
node scripts/ops/watch-pushed-deployment.test.mjs
node .codex/hooks/post-git-push-check.test.mjs
npm run test:ops
```

For broad repository changes, also run:

```bash
npm test
npm run typecheck
npm run build
```

Manual live checks require a trusted Codex hook, authenticated `gh`, and a real `git push`; do not fake completion if those conditions were not exercised.

## User-Facing Documentation

Keep human setup and sharing material in `docs/ops/codex-post-push-watcher.md`. Update that document when changing prerequisites, new-PC setup, status file locations, Vercel/GitHub assumptions, or the example prompt another AI should use.
