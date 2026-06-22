# LeetCode Minimal Archive Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rework the public `/leetcode` page into a quiet minimal archive snapshot with clickable progress, review, activity, and category entry points.

**Architecture:** Keep the change scoped to `apps/web/src/app/leetcode/page.tsx`, its page contract test, and LeetCode-specific CSS in `apps/web/src/app/styles.css`. Continue loading `StudyDashboard` through `loadRepositoryStudyDashboard`; derive anchors and display summaries locally in the route.

**Tech Stack:** Next.js App Router, React server components, Vitest source contract tests, existing CSS cyber/glass tokens.

---

### Task 1: Lock Page Contract

**Files:**
- Modify: `apps/web/src/app/leetcode/leetcode-page.test.ts`

- [ ] **Step 1: Write failing test expectations**

Add expectations that prove the page exposes the minimal clickable archive contract:

```ts
expect(source).toContain('study-snapshot-hero');
expect(source).toContain('href="#review-rhythm"');
expect(source).toContain('href="#today-plan"');
expect(source).toContain('href="#activity"');
expect(source).toContain('href="#categories"');
expect(source).toContain('study-round-link');
expect(source).toContain('buildCategoryAnchor');
expect(source).not.toContain('study-command-grid');
expect(source).not.toContain('study-task-board');
expect(source).not.toContain('study-progress-orb');
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm run test --workspace @starry-summer/web -- src/app/leetcode/leetcode-page.test.ts
```

Expected: FAIL because `study-snapshot-hero`, linked hash entries, and `buildCategoryAnchor` are not implemented yet.

- [ ] **Step 3: Commit is deferred**

Do not commit yet; complete the page and style tasks first so the branch stays focused.

### Task 2: Rebuild Route Markup

**Files:**
- Modify: `apps/web/src/app/leetcode/page.tsx`

- [ ] **Step 1: Implement minimal snapshot layout**

Replace the dense overview with:

```tsx
<section className="study-snapshot-hero" aria-label="LeetCode 学习快照">
  <div className="study-snapshot-hero__copy">...</div>
  <a className="study-progress-link" href="#review-rhythm">...</a>
  <div className="study-snapshot-links">...</div>
  <nav className="study-round-links" aria-label="五轮复习入口">...</nav>
</section>
```

Keep today, review rhythm, categories, activity, and recent submissions as lower sections with matching ids.

- [ ] **Step 2: Add helpers**

Add helpers in the same route file:

```ts
function buildCategoryAnchor(name: string) {
  return `category-${name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'uncategorized'}`;
}
```

Use it for category chip ids and hrefs.

- [ ] **Step 3: Preserve existing data behavior**

Keep `loadRepositoryStudyDashboard`, `buildStudyHeatmapWindow`, `buildRoundTrack`, `StudyTaskCard`, `ReviewTaskCard`, and LeetCode problem links. Do not add API calls or client state.

### Task 3: Restyle LeetCode Page

**Files:**
- Modify: `apps/web/src/app/styles.css`
- Modify: `apps/web/src/app/styles/responsive.css`

- [ ] **Step 1: Add quiet snapshot styles**

Add LeetCode-specific selectors for:

```css
.study-snapshot-hero
.study-snapshot-hero__copy
.study-progress-link
.study-snapshot-links
.study-snapshot-link
.study-round-links
.study-round-link
.study-category-chip
.study-activity-grid
```

The visual rules: dark glass panels, low-contrast borders, compact chips, cyan hover/focus states, no white panels.

- [ ] **Step 2: Adjust existing study card styles**

Keep existing `.study-task-card`, `.study-round-grid`, `.study-category-grid`, `.study-heatmap`, and `.leetcode-item` selectors, but make them quieter and compatible with the new snapshot layout.

- [ ] **Step 3: Add responsive rules**

Add mobile rules so the hero, linked stats, round strip, category chips, and recent submissions do not overflow at narrow widths.

### Task 4: Verify

**Files:**
- Test: `apps/web/src/app/leetcode/leetcode-page.test.ts`
- Visual route: `/leetcode`

- [ ] **Step 1: Run focused test**

Run:

```bash
npm run test --workspace @starry-summer/web -- src/app/leetcode/leetcode-page.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run typecheck**

Run:

```bash
npm run typecheck --workspace @starry-summer/web
```

Expected: PASS.

- [ ] **Step 3: Run local dev server and inspect `/leetcode`**

Run:

```bash
npm run dev --workspace @starry-summer/web
```

Open `http://127.0.0.1:3000/leetcode` in the in-app browser and verify no white panels, no horizontal overflow, readable text, compact chips, and clickable hash links.

- [ ] **Step 4: Commit**

Stage only files modified for this task:

```bash
git add docs/superpowers/plans/2026-06-22-leetcode-minimal-archive.md apps/web/src/app/leetcode/page.tsx apps/web/src/app/leetcode/leetcode-page.test.ts apps/web/src/app/styles.css apps/web/src/app/styles/responsive.css
git commit -m "Refine LeetCode archive page"
```
