# Personal Content Platform Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a deployable V1 personal content platform with public reading, single-admin authoring, Markdown ownership, reader interaction, and cloud-server deployment assets.

**Architecture:** Use an npm-workspace monorepo with a Next.js web app for the public site and admin UI, a NestJS API app for content/auth/interaction, and shared packages for types and Markdown rendering. PostgreSQL is the production database target, Redis supports counters and rate limiting, and object storage is abstracted behind API services.

**Tech Stack:** TypeScript, npm workspaces, Next.js, React, NestJS, PostgreSQL, Redis, Vitest/Jest, Docker Compose, Caddy.

---

## File Structure

- `package.json`: root workspace scripts.
- `.gitignore`: generated files and local secrets.
- `.env.example`: documented local and production configuration.
- `tsconfig.base.json`: shared TypeScript defaults.
- `apps/api`: NestJS API application.
- `apps/api/src/auth`: single-admin authentication module.
- `apps/api/src/content`: content model, Markdown import/export, public/admin content APIs.
- `apps/api/src/interactions`: comments, guestbook, likes, and views.
- `apps/api/src/settings`: public site profile and navigation settings.
- `apps/web`: Next.js public site and admin UI.
- `apps/web/src/app`: App Router routes for public and admin pages.
- `apps/web/src/components`: shared UI components.
- `packages/shared`: shared TypeScript contracts and validation helpers.
- `packages/markdown`: Markdown rendering, front matter, sanitization, import/export helpers.
- `infra/docker`: Dockerfiles and deployment support.
- `docker-compose.yml`: local/prod-compatible service topology.
- `docs`: product, implementation, and deployment documentation.

## Task 1: Workspace Foundation

**Files:**
- Create: `package.json`
- Create: `.gitignore`
- Create: `.env.example`
- Create: `tsconfig.base.json`
- Create: `README.md`

- [ ] **Step 1: Write root workspace files**

Create root npm workspace scripts:

```json
{
  "name": "starry-summer",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev": "npm run dev --workspace @starry-summer/web",
    "dev:web": "npm run dev --workspace @starry-summer/web",
    "dev:api": "npm run start:dev --workspace @starry-summer/api",
    "build": "npm run build --workspaces --if-present",
    "test": "npm run test --workspaces --if-present",
    "lint": "npm run lint --workspaces --if-present",
    "typecheck": "npm run typecheck --workspaces --if-present"
  }
}
```

- [ ] **Step 2: Verify workspace metadata**

Run: `npm install`

Expected: `package-lock.json` is created and npm reports successful install.

- [ ] **Step 3: Commit**

Run:

```bash
git add package.json package-lock.json .gitignore .env.example tsconfig.base.json README.md
git commit -m "chore: initialize workspace"
```

## Task 2: Shared Domain Contracts

**Files:**
- Create: `packages/shared/package.json`
- Create: `packages/shared/tsconfig.json`
- Create: `packages/shared/src/content.ts`
- Create: `packages/shared/src/interactions.ts`
- Create: `packages/shared/src/settings.ts`
- Create: `packages/shared/src/index.ts`
- Create: `packages/shared/src/content.test.ts`

- [ ] **Step 1: Write failing content contract tests**

Test published visibility and slug validation:

```ts
import { canPublishContent, isPublicContent, isValidSlug } from './content';

test('published public content is visible to readers', () => {
  expect(isPublicContent({ status: 'published', visibility: 'public' })).toBe(true);
});

test('draft content is not visible to readers', () => {
  expect(isPublicContent({ status: 'draft', visibility: 'public' })).toBe(false);
});

test('valid slugs use lowercase letters numbers and hyphens', () => {
  expect(isValidSlug('my-first-post-2026')).toBe(true);
  expect(isValidSlug('My First Post')).toBe(false);
});

test('content needs title slug and markdown body before publish', () => {
  expect(canPublishContent({ title: 'Hello', slug: 'hello', bodyMarkdown: '# Hello' })).toBe(true);
  expect(canPublishContent({ title: 'Hello', slug: 'bad slug', bodyMarkdown: '# Hello' })).toBe(false);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test --workspace @starry-summer/shared`

Expected: failure because shared package implementation is missing.

- [ ] **Step 3: Implement minimal domain helpers**

Add content status, visibility, content type, and helper functions in `packages/shared/src/content.ts`.

- [ ] **Step 4: Run tests**

Run: `npm test --workspace @starry-summer/shared`

Expected: all shared tests pass.

- [ ] **Step 5: Commit**

Run:

```bash
git add packages/shared
git commit -m "feat: add shared content contracts"
```

## Task 3: Markdown Package

**Files:**
- Create: `packages/markdown/package.json`
- Create: `packages/markdown/tsconfig.json`
- Create: `packages/markdown/src/frontmatter.test.ts`
- Create: `packages/markdown/src/frontmatter.ts`
- Create: `packages/markdown/src/render.test.ts`
- Create: `packages/markdown/src/render.ts`
- Create: `packages/markdown/src/index.ts`

- [ ] **Step 1: Write failing front matter tests**

Test parse/export behavior:

```ts
import { parseMarkdownDocument, serializeMarkdownDocument } from './frontmatter';

test('parses front matter and body', () => {
  const parsed = parseMarkdownDocument('---\ntitle: Hello\nslug: hello\n---\n# Hello');
  expect(parsed.frontmatter.title).toBe('Hello');
  expect(parsed.frontmatter.slug).toBe('hello');
  expect(parsed.body).toBe('# Hello');
});

test('serializes front matter and body', () => {
  const text = serializeMarkdownDocument({ frontmatter: { title: 'Hello', slug: 'hello' }, body: '# Hello' });
  expect(text).toContain('title: Hello');
  expect(text).toContain('slug: hello');
  expect(text.endsWith('# Hello\n')).toBe(true);
});
```

- [ ] **Step 2: Write failing render tests**

Test Markdown-to-safe-HTML behavior:

```ts
import { renderMarkdown } from './render';

test('renders headings and paragraphs', async () => {
  const html = await renderMarkdown('# Hello\n\nWorld');
  expect(html).toContain('<h1');
  expect(html).toContain('Hello');
  expect(html).toContain('<p>World</p>');
});

test('removes script tags from rendered html', async () => {
  const html = await renderMarkdown('<script>alert(1)</script>\n\nSafe');
  expect(html).not.toContain('<script');
  expect(html).toContain('Safe');
});
```

- [ ] **Step 3: Run tests to verify failure**

Run: `npm test --workspace @starry-summer/markdown`

Expected: failure because package implementation is missing.

- [ ] **Step 4: Implement parser and renderer**

Use `gray-matter`, `unified`, `remark-parse`, `remark-rehype`, `rehype-stringify`, and `sanitize-html`.

- [ ] **Step 5: Run tests**

Run: `npm test --workspace @starry-summer/markdown`

Expected: all Markdown tests pass.

- [ ] **Step 6: Commit**

Run:

```bash
git add packages/markdown
git commit -m "feat: add markdown ownership helpers"
```

## Task 4: API Foundation

**Files:**
- Create: `apps/api/package.json`
- Create: `apps/api/tsconfig.json`
- Create: `apps/api/src/main.ts`
- Create: `apps/api/src/app.module.ts`
- Create: `apps/api/src/health/health.controller.ts`
- Create: `apps/api/src/health/health.controller.spec.ts`

- [ ] **Step 1: Write failing health test**

```ts
import { HealthController } from './health.controller';

test('returns ok status and service name', () => {
  const controller = new HealthController();
  expect(controller.check()).toEqual({ status: 'ok', service: 'starry-summer-api' });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npm test --workspace @starry-summer/api -- health.controller`

Expected: failure because controller is missing.

- [ ] **Step 3: Implement NestJS app foundation**

Add `AppModule`, `HealthController`, global validation, and `/health` route.

- [ ] **Step 4: Run tests**

Run: `npm test --workspace @starry-summer/api`

Expected: API tests pass.

- [ ] **Step 5: Commit**

Run:

```bash
git add apps/api
git commit -m "feat: add api foundation"
```

## Task 5: API Content and Interaction Modules

**Files:**
- Create: `apps/api/src/content/content.service.ts`
- Create: `apps/api/src/content/content.service.spec.ts`
- Create: `apps/api/src/content/content.controller.ts`
- Create: `apps/api/src/content/admin-content.controller.ts`
- Create: `apps/api/src/interactions/interactions.service.ts`
- Create: `apps/api/src/interactions/interactions.service.spec.ts`
- Create: `apps/api/src/interactions/interactions.controller.ts`
- Modify: `apps/api/src/app.module.ts`

- [ ] **Step 1: Write failing content service tests**

Test that public listings exclude drafts and private content, and admin creation can create drafts.

- [ ] **Step 2: Run test to verify failure**

Run: `npm test --workspace @starry-summer/api -- content.service`

Expected: failure because content service is missing.

- [ ] **Step 3: Implement in-memory repository for V1 foundation**

Create a replaceable repository boundary so PostgreSQL integration can replace storage without changing controllers.

- [ ] **Step 4: Write failing interaction tests**

Test pending comments, approved comments, like increments, and guestbook moderation defaults.

- [ ] **Step 5: Implement interaction service**

Add services and public controllers for comments, likes, views, and guestbook.

- [ ] **Step 6: Run tests**

Run: `npm test --workspace @starry-summer/api`

Expected: all API tests pass.

- [ ] **Step 7: Commit**

Run:

```bash
git add apps/api/src
git commit -m "feat: add content and interaction api modules"
```

## Task 6: Web Foundation

**Files:**
- Create: `apps/web/package.json`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/next.config.ts`
- Create: `apps/web/src/app/layout.tsx`
- Create: `apps/web/src/app/page.tsx`
- Create: `apps/web/src/app/posts/page.tsx`
- Create: `apps/web/src/app/admin/page.tsx`
- Create: `apps/web/src/app/admin/login/page.tsx`
- Create: `apps/web/src/components/SiteShell.tsx`
- Create: `apps/web/src/components/ContentCard.tsx`
- Create: `apps/web/src/lib/content.ts`
- Create: `apps/web/src/lib/content.test.ts`

- [ ] **Step 1: Write failing web content tests**

Test sorting, grouping, and public filtering used by public pages.

- [ ] **Step 2: Run test to verify failure**

Run: `npm test --workspace @starry-summer/web`

Expected: failure because web helpers are missing.

- [ ] **Step 3: Implement public pages and helpers**

Build home, posts, admin shell, and login screens using local seed data until API wiring lands.

- [ ] **Step 4: Run tests and build**

Run:

```bash
npm test --workspace @starry-summer/web
npm run build --workspace @starry-summer/web
```

Expected: tests and Next.js build pass.

- [ ] **Step 5: Commit**

Run:

```bash
git add apps/web
git commit -m "feat: add web foundation"
```

## Task 7: Deployment Assets

**Files:**
- Create: `apps/web/Dockerfile`
- Create: `apps/api/Dockerfile`
- Create: `docker-compose.yml`
- Create: `infra/caddy/Caddyfile`
- Create: `docs/deployment.md`

- [ ] **Step 1: Add Dockerfiles and Compose services**

Define `web`, `api`, `postgres`, `redis`, `minio`, and `caddy` services with persistent volumes.

- [ ] **Step 2: Add deployment documentation**

Document environment setup, first boot, HTTPS domain setup, backup, restore, and logs.

- [ ] **Step 3: Validate Compose config**

Run: `docker compose config`

Expected: Compose file renders without errors.

- [ ] **Step 4: Commit**

Run:

```bash
git add apps/web/Dockerfile apps/api/Dockerfile docker-compose.yml infra/caddy/Caddyfile docs/deployment.md
git commit -m "chore: add cloud server deployment assets"
```

## Task 8: Full Verification Pass

**Files:**
- Modify as needed based on verification failures.

- [ ] **Step 1: Run all tests**

Run: `npm test`

Expected: all workspace tests pass.

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`

Expected: all workspaces typecheck.

- [ ] **Step 3: Run build**

Run: `npm run build`

Expected: web, API, and packages build.

- [ ] **Step 4: Inspect git state**

Run: `git status --short`

Expected: clean working tree after committed changes, or only intentional uncommitted notes.

## Self-Review

Spec coverage:

- Public routes are covered by Task 6.
- Admin entry points are covered by Task 6, with deeper editor workflows to be expanded after the foundation is running.
- Content contracts and visibility are covered by Task 2 and Task 5.
- Markdown import/export foundation is covered by Task 3.
- Comments, likes, views, and guestbook are covered by Task 5.
- Docker cloud-server deployment is covered by Task 7.
- Security foundations are started by Task 4 and Task 5; production-hardening details continue after the first runnable milestone.

Known follow-up after this plan:

- Replace in-memory API repositories with PostgreSQL persistence and migrations.
- Add real admin session authentication instead of UI-only login screens.
- Wire web pages to API endpoints.
- Build the full Markdown editor and moderation dashboard.
