# Starry Summer Automation Runbook

This runbook defines the reusable automation path for Starry Summer. It is safe to publish because it documents behavior and commands, not tokens or local session state.

## Pipeline

1. Developer opens a pull request.
2. GitHub Actions runs CI: tests, typecheck, build, and repository ops guards.
3. Codex PR guard checks open pull requests for conflicts and failing checks.
4. Code-fixable failures may be repaired in an isolated worktree, verified, committed, and pushed back to the PR branch.
5. Healthy PRs may be merged automatically only when all merge gates pass.
6. Production smoke checks run against `https://www.asterh.me`.
7. Code regressions found in production are reproduced locally, fixed on a new branch, and sent through the PR path.

## Event-Driven Local Follow-Up

The repository includes a local Codex hook at `.codex/hooks.json`. When Codex runs a successful `git push` through the Bash tool, the hook starts `scripts/ops/watch-pushed-deployment.mjs` in the background for the pushed branch and commit SHA.

The watcher reads GitHub through `gh`, tracks the related pull request when one exists, inspects CI and Vercel checks, and records terminal results in `.codex/local/post-push-status.jsonl`. That local JSONL file is ignored by Git and can be used by a later Codex session to understand the most recent post-push outcome.

For `main` pushes, the watcher runs the shared production smoke command after GitHub/Vercel checks are successful:

```bash
npm run ops:production-smoke -- --base-url https://www.asterh.me
```

The watcher does not change Vercel settings, merge pull requests, or push follow-up commits. It reports status only.

## Vercel Deployment Events

Vercel deployment events are routed through GitHub `repository_dispatch` in `.github/workflows/production-smoke.yml`.

- `vercel.deployment.success` runs the production smoke workflow.
- `vercel.deployment.error` and `vercel.deployment.failed` fail the workflow with the deployment URL and environment in the logs.
- The scheduled production smoke remains as a low-frequency fallback for drift that is not tied to a fresh deployment.

## Auto-Fix Allowed

Automation may fix and push when all of these are true:

- The failure is a code or test regression in this repository.
- The failure is reproducible locally.
- The fix is narrow and preserves existing product direction.
- Verification passes with `npm test`, `npm run typecheck`, and `npm run build`.
- The branch is a PR branch, not `main`.
- The change does not overwrite unrelated user work.

## Auto-Merge Allowed

Automation may merge a PR only when all of these are true:

- The PR is not a draft.
- The PR has no merge conflicts.
- Required checks are complete and passing.
- There are no failed, pending, or missing required checks.
- The issue is not classified as external configuration.
- The merge method is non-destructive; prefer squash merge.
- The branch is not deleted after merge unless a repository rule requires it.

## Human Approval Required

Automation must stop and report when the issue involves:

- Vercel project settings, root directory, install command, build command, framework preset, or linked project.
- Secrets, environment variables, tokens, permissions, domains, billing, or account access.
- Ambiguous product behavior or visual design choices.
- Failures that cannot be reproduced locally.
- Any fix that requires changing public identity policy.

## Verification Commands

Use these commands before reporting a code fix as ready:

```bash
npm test
npm run typecheck
npm run build
```

Use these optional focused checks while debugging:

```bash
npm run test --workspace @starry-summer/web -- src/app/leetcode/leetcode-page.test.ts
node scripts/ops/public-identity-guard.test.mjs
node scripts/ops/production-smoke.test.mjs
node scripts/ops/pr-health.test.mjs
npm run ops:production-smoke -- --base-url https://www.asterh.me
npm run ops:pr-health -- --pr 3 --format json
```

Use `ops:pr-health` as the reusable auto-merge gate. It reads GitHub PR state through `gh`, reports merge conflicts, failing checks, and pending checks, and exits non-zero when automation should stop. The CI workflow runs it on pull requests after test, typecheck, and build complete; it ignores the in-progress `Verify` check so the gate does not block on itself. Healthy `codex/**` pull requests request GitHub squash auto-merge pinned to the checked head commit.

## Rollback

Automation should not push directly to `main`. If production smoke fails after a merge, create a revert PR or a targeted fix PR. Direct rollback of `main` requires explicit human approval.

## Local Codex Automation Template

Create local Codex automations from this runbook rather than committing machine-specific automation state. Keep local paths, tokens, cookies, and session data out of the repository.
