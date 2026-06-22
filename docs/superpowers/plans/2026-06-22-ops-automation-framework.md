# Ops Automation Framework Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add reusable repository-level CI, production smoke checks, public identity guards, and automation runbooks for Starry Summer.

**Architecture:** Keep portable checks in `scripts/ops/*.mjs` so GitHub Actions and Codex automations can reuse the same logic. Keep networked production checks out of default `npm test`; default tests exercise the scripts with local fixtures while scheduled workflows run live smoke checks.

**Tech Stack:** Node.js 22 scripts, GitHub Actions, existing npm workspaces, built-in `node:test`-style assertions via `node:assert`.

---

### Task 1: Script Tests

**Files:**
- Create: `scripts/ops/public-identity-guard.test.mjs`
- Create: `scripts/ops/production-smoke.test.mjs`

- [ ] **Step 1: Add failing tests**

Add tests that import script helpers and assert:

```js
assert.deepEqual(findPublicIdentityViolations([{ file: 'apps/web/src/app/page.tsx', source: 'Aster.H' }]), []);
assert.equal(findPublicIdentityViolations([{ file: 'apps/web/src/app/page.tsx', source: 'FORBIDDEN_OWNER_NAME_FIXTURE' }]).length, 1);
```

For smoke checks, start a local HTTP server and assert successful routes pass while 500/error-page routes fail.

- [ ] **Step 2: Run tests and verify failure**

Run:

```bash
node scripts/ops/public-identity-guard.test.mjs
node scripts/ops/production-smoke.test.mjs
```

Expected: FAIL because the scripts do not exist yet.

### Task 2: Ops Scripts

**Files:**
- Create: `scripts/ops/public-identity-guard.mjs`
- Create: `scripts/ops/production-smoke.mjs`
- Modify: `package.json`

- [ ] **Step 1: Implement public identity guard**

The guard scans tracked files from `git ls-files`, focusing public-facing source/content/docs, and fails if known forbidden owner-name patterns appear. It allows `Aster.H`.

- [ ] **Step 2: Implement production smoke checker**

The smoke checker accepts `--base-url`, checks core routes, validates successful HTTP status, and rejects obvious platform/framework error pages.

- [ ] **Step 3: Add npm scripts**

Add:

```json
"ops:public-identity-guard": "node scripts/ops/public-identity-guard.mjs",
"ops:production-smoke": "node scripts/ops/production-smoke.mjs"
```

Update `test:ops` to run repository hygiene plus the new script tests and identity guard.

### Task 3: GitHub Actions

**Files:**
- Create or modify: `.github/workflows/ci.yml`
- Create: `.github/workflows/production-smoke.yml`

- [ ] **Step 1: Commit CI workflow**

Use the existing untracked CI workflow and make sure it runs `npm test`, `npm run typecheck`, and `npm run build`.

- [ ] **Step 2: Add production smoke workflow**

Run hourly and on manual dispatch:

```yaml
node scripts/ops/production-smoke.mjs --base-url https://www.asterh.me
```

### Task 4: Documentation

**Files:**
- Create: `docs/ops/automation-runbook.md`
- Create: `docs/ops/vercel-projects.md`

- [ ] **Step 1: Write automation runbook**

Document what automation can auto-fix, what needs approval, auto-merge gates, verification commands, and rollback behavior.

- [ ] **Step 2: Write Vercel project notes**

Document canonical Vercel project expectations and the known duplicate-project failure mode where one project reports `tsc: command not found`.

### Task 5: Verification

- [ ] **Step 1: Run focused script tests**

```bash
node scripts/ops/public-identity-guard.test.mjs
node scripts/ops/production-smoke.test.mjs
```

- [ ] **Step 2: Run full checks**

```bash
npm test
npm run typecheck
npm run build
```

- [ ] **Step 3: Commit**

Stage only ops framework files and commit:

```bash
git add .github/workflows/ci.yml .github/workflows/production-smoke.yml package.json scripts/ops docs/ops docs/superpowers/plans/2026-06-22-ops-automation-framework.md
git commit -m "Add ops automation framework"
```
