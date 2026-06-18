# Reference Posts Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rework `/posts` into a YYsuni-style grouped article archive while preserving Starry Summer's dark cyber/glass public theme.

**Architecture:** Keep the change scoped to the posts route. Add a posts-specific grouping helper inside `apps/web/src/app/posts/page.tsx`, render grouped article rows instead of shared `ContentCard`, and style new `posts-archive-*` selectors in global CSS so other content families are untouched.

**Tech Stack:** Next.js server components, existing `SiteContentItem` content model, Vitest source/CSS contract tests, global CSS tokens.

---

### Task 1: Lock Posts Page Structure

**Files:**
- Modify: `apps/web/src/app/posts/posts-page.test.ts`
- Modify: `apps/web/src/app/posts/page.tsx`

- [ ] **Step 1: Write the failing test**

Add a test that reads `src/app/posts/page.tsx` and expects posts-specific grouped archive markup:

```ts
expect(source).toContain('groupPostsByYear(posts)');
expect(source).toContain('className="posts-archive"');
expect(source).toContain('className="posts-archive-group"');
expect(source).toContain('className="posts-archive-item"');
expect(source).toContain('className="posts-archive-item__cover-preview"');
expect(source).not.toContain('<ContentCard key={item.id} item={item} />');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test --workspace @starry-summer/web -- posts-page.test.ts`

Expected: FAIL because `posts-archive` selectors do not exist.

- [ ] **Step 3: Write minimal implementation**

Replace the `.content-grid` rendering in `apps/web/src/app/posts/page.tsx` with grouped archive sections. Use `getContentHref`, `getContentTaxonomyLinkGroups`, and `getContentCover`; keep sorting from `loadSiteContent`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test --workspace @starry-summer/web -- posts-page.test.ts`

Expected: PASS.

### Task 2: Lock Dark Cyber Styling

**Files:**
- Modify: `apps/web/src/app/styles.test.ts`
- Modify: `apps/web/src/app/styles.css`

- [ ] **Step 1: Write the failing CSS contract test**

Add expectations for `.posts-archive`, `.posts-archive-group`, `.posts-archive-item`, `.posts-archive-item__dot`, `.posts-archive-item__cover-preview`, and day-theme variants. Assert dark glass backgrounds, cyan hover accent, no white panels in the default posts archive selectors, and fixed hover preview geometry.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test --workspace @starry-summer/web -- styles.test.ts`

Expected: FAIL because posts archive selectors are missing.

- [ ] **Step 3: Write minimal CSS**

Add posts-specific selectors near the public content list styles. Do not modify shared `ContentCard` behavior. Add mobile rules in `apps/web/src/app/styles/responsive.css` only if the base CSS cannot keep rows readable on 390px.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test --workspace @starry-summer/web -- styles.test.ts`

Expected: PASS.

### Task 3: Verify Real Routes

**Files:**
- No production file changes expected after this task unless browser verification finds a defect.

- [ ] **Step 1: Run targeted tests**

Run: `npm test --workspace @starry-summer/web -- posts-page.test.ts styles.test.ts`

Expected: PASS.

- [ ] **Step 2: Browser-check `/posts`**

Use the running dev server at `http://localhost:3000/posts`. Verify no horizontal overflow at desktop and 390px mobile widths, no accidental white panels in night theme, readable text, compact tags, and working article links.

- [ ] **Step 3: Run full verification**

Run:

```bash
npm test
npm run typecheck
npm run build
```

Expected: all commands exit 0.
