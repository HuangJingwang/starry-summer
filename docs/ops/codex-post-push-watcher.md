# Codex Post-Push Watcher

Starry Summer includes a local Codex post-push watcher. It is a small, reusable ops pattern for people who use Codex locally to push code and want fast feedback from GitHub Actions and Vercel without running a cron job all day.

## What It Solves

The old shape was mostly time-based: check PRs and production on a schedule. That works, but it can waste runs when no code changed.

The watcher changes the first follow-up step to an event-driven local flow:

```text
Codex runs git push
  -> local Codex hook starts a watcher
  -> watcher reads GitHub PR/check/Vercel state
  -> watcher records the result locally
```

This is useful when Codex pushes are the normal way changes leave the machine, and when GitHub/Vercel already hold the authoritative deployment state.

## Files

- `.codex/hooks.json`: registers the Codex `PostToolUse` hook.
- `.codex/hooks/post-git-push-check.mjs`: detects successful `git push` commands and starts the watcher.
- `scripts/ops/watch-pushed-deployment.mjs`: watches GitHub checks, Vercel checks, PR state, and production smoke.
- `scripts/ops/watch-pushed-deployment.test.mjs`: tests the status classification logic.
- `.codex/skills/codex-post-push-watcher/SKILL.md`: reusable Codex skill for adapting the pattern to another repository.

## Runtime Behavior

When Codex executes a successful `git push` through its Bash tool, the hook starts a detached watcher for the current branch and commit SHA.

The watcher:

- finds a PR with `gh pr list --head <branch>` when one exists
- reads PR status checks or commit check-runs/statuses
- identifies Vercel checks by check name or context
- treats pending checks as non-terminal
- treats failed checks, merge conflicts, draft PRs, or failed production smoke as failures
- runs production smoke after successful `main` checks
- appends terminal results to `.codex/local/post-push-status.jsonl`
- sends a best-effort macOS notification

The watcher does not merge, push, fix code, or change Vercel settings.

## Vercel Events

`.github/workflows/production-smoke.yml` also listens for Vercel `repository_dispatch` events:

- `vercel.deployment.success`: run production smoke.
- `vercel.deployment.error`: fail the workflow and print deployment evidence.
- `vercel.deployment.failed`: fail the workflow and print deployment evidence.

The scheduled smoke check remains as a fallback for production drift not tied to a fresh deployment.

## Requirements

- Codex hooks enabled and the repo-local hook trusted.
- GitHub CLI installed and authenticated.
- Vercel connected to GitHub so deployment status appears in GitHub checks.
- The Vercel repository dispatch workflow must exist on `main` before Vercel can trigger it.

## Start On A New PC

The automation is designed to travel with the repository. A fresh machine only needs local tools and login state:

```bash
git clone <repo>
cd starry-summer
npm install
gh auth login
node .codex/hooks/post-git-push-check.test.mjs
node scripts/ops/watch-pushed-deployment.test.mjs
```

Then open the repository in Codex and trust the repo-local hook from `.codex/hooks.json`. After that, a successful Codex-run `git push` is enough to start the watcher.

Check the latest local result with:

```bash
tail -n 5 .codex/local/post-push-status.jsonl
```

If the file does not exist yet, no terminal post-push result has been recorded on that machine.

## What Another AI Should Read First

When handing this flow to another Codex session or another AI coding agent, point it at the repository skill:

```text
Use $codex-post-push-watcher to understand, restore, or adapt this repository's Codex post-push watcher.
```

The AI should inspect these files before changing behavior:

- `.codex/hooks.json`
- `.codex/hooks/post-git-push-check.mjs`
- `scripts/ops/watch-pushed-deployment.mjs`
- `scripts/ops/watch-pushed-deployment.test.mjs`
- `.github/workflows/production-smoke.yml`
- this document

The important boundary is simple: the watcher reports CI, PR, Vercel, and smoke-check state. It does not merge PRs, push fixes, edit secrets, change Vercel settings, or rerun deployments.

## Using The Skill

The reusable implementation guide lives at:

```text
.codex/skills/codex-post-push-watcher/SKILL.md
```

Use it when adapting the pattern to another repository:

```text
Use $codex-post-push-watcher to add a local Codex post-push watcher for this GitHub/Vercel project.
```

The skill keeps the general architecture separate from Starry Summer-specific details such as the production domain and smoke command.
