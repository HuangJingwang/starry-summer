# Admin Light Workbench Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the approved writing-first Starry Summer admin workbench with four primary workspaces and fewer configuration-heavy jumps.

**Architecture:** Keep the existing Next.js routes and repository-mode data loaders, but recompose the admin shell and page surfaces around four workspaces: 写作, 内容, 互动, 站点. Avoid persistence model changes in this pass; focus on navigation, composition, honest repository-mode affordances, and editor layout preparation.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Vitest, existing CSS in `apps/web/src/app/styles/admin.css` and `responsive.css`.

---

## File Map

- Modify `apps/web/src/lib/navigation.ts`: expose four primary admin workspaces.
- Modify `apps/web/src/lib/navigation.test.ts`: TDD coverage for the four-workspace admin navigation.
- Modify `apps/web/src/components/AdminShell.tsx`: rename shell language and make command-bar actions contextual.
- Modify `apps/web/src/app/admin/admin-localization.test.ts`: update durable source assertions for the lightweight shell.
- Modify `apps/web/src/app/admin/page.tsx`: replace metric-heavy dashboard with writing workbench sections.
- Modify `apps/web/src/lib/admin-content-dashboard.ts`: add or adjust small view-model helpers if the writing workbench needs direct draft/recent lists.
- Modify `apps/web/src/components/AdminContentManager.tsx`: simplify content dashboard composition.
- Modify `apps/web/src/components/AdminContentTable.tsx`: hide misleading repository-mode batch actions and add inline preview/copy-link affordances.
- Modify `apps/web/src/app/admin/content/page.tsx`: replace large filter form with compact filter controls and a disclosure.
- Modify `apps/web/src/components/SettingsManager.tsx`: reframe settings as site maintenance sections, including scoped appearance controls.
- Modify `apps/web/src/components/TaxonomyManager.tsx`: present repository-mode taxonomy as derived read-only index.
- Modify `apps/web/src/components/AdminContentForm.tsx`: keep writing controls always visible and keep metadata in the publish settings drawer.
- Modify `apps/web/src/app/styles/admin.css`: reduce nested panel weight and add workbench/filter/site-maintenance styles.
- Modify `apps/web/src/app/styles/responsive.css`: keep the new workbench usable on mobile.

## Task 1: Admin Navigation Four Workspaces

**Files:**
- Modify: `apps/web/src/lib/navigation.test.ts`
- Modify: `apps/web/src/lib/navigation.ts`
- Modify: `apps/web/src/components/AdminShell.tsx`
- Modify: `apps/web/src/app/admin/admin-localization.test.ts`

- [ ] **Step 1: Write the failing navigation test**

Replace the admin navigation expectation with:

```ts
expect(buildAdminNavigation()).toEqual([
  { href: '/admin', label: '写作' },
  { href: '/admin/content', label: '内容' },
  {
    href: '/admin/comments',
    label: '互动',
    children: [
      { href: '/admin/comments', label: '评论与留言' },
      { href: '/admin/guestbook', label: '留言管理' },
    ],
  },
  {
    href: '/admin/settings',
    label: '站点',
    children: [
      { href: '/admin/assets', label: '素材维护' },
      { href: '/admin/taxonomy', label: '分类索引' },
      { href: '/admin/export', label: '导入导出' },
      { href: '/admin/settings', label: '站点设置' },
      { href: '/admin/study', label: '学习工具' },
    ],
  },
]);
```

- [ ] **Step 2: Run the failing test**

Run: `npm run test --workspace @starry-summer/web -- src/lib/navigation.test.ts`

Expected: FAIL because the implementation still returns `概览`, `项目`, `学习`, `素材`, and `设置` as primary items.

- [ ] **Step 3: Implement the new navigation model**

Update `adminNavigation` in `apps/web/src/lib/navigation.ts` to match the four-workspace expectation.

- [ ] **Step 4: Update shell copy**

In `apps/web/src/components/AdminShell.tsx`, update the brand subtitle and command bar title so the shell reads as a writing workbench:

```tsx
<small>Light Workbench</small>
...
<span>写作</span>
<strong>内容轻工作台</strong>
```

Keep `ThemeToggle`, active path handling, and child navigation behavior.

- [ ] **Step 5: Run focused tests**

Run: `npm run test --workspace @starry-summer/web -- src/lib/navigation.test.ts src/app/admin/admin-localization.test.ts`

Expected: PASS.

## Task 2: Writing Workbench Landing Page

**Files:**
- Modify: `apps/web/src/app/admin/page.tsx`
- Modify: `apps/web/src/lib/admin-content-dashboard.ts`
- Test: create or update `apps/web/src/app/admin/admin-workbench.test.ts`

- [ ] **Step 1: Write failing source-level workbench tests**

Add tests that assert `/admin/page.tsx` contains the four workbench section labels `继续写`, `快速新建`, `今日处理`, and `最近内容`, and no longer uses `admin-dashboard-grid`.

- [ ] **Step 2: Run the failing test**

Run: `npm run test --workspace @starry-summer/web -- src/app/admin/admin-workbench.test.ts`

Expected: FAIL because the page still uses the old dashboard layout.

- [ ] **Step 3: Recompose `/admin`**

Use existing `items`, `stats`, `overview`, and moderation counts to render:

- a compact intro panel titled `写作工作台`;
- a `继续写` list using draft and recently edited items;
- a `快速新建` group linking to `/admin/content/new?type=post`, `/admin/content/new?type=note`, `/admin/content/new?type=moment`, and `/admin/content/new?type=project`;
- a `今日处理` section linking to comments and guestbook moderation;
- a `最近内容` list linking directly to edit routes.

- [ ] **Step 4: Run workbench tests**

Run: `npm run test --workspace @starry-summer/web -- src/app/admin/admin-workbench.test.ts`

Expected: PASS.

## Task 3: Compact Content Library

**Files:**
- Modify: `apps/web/src/app/admin/content/page.tsx`
- Modify: `apps/web/src/components/AdminContentManager.tsx`
- Modify: `apps/web/src/components/AdminContentTable.tsx`
- Test: `apps/web/src/components/admin-content-table.test.ts`

- [ ] **Step 1: Add failing tests for compact filtering and honest repository mode**

Assert the content page source contains `admin-filter-bar`, type/status compact controls, and a `更多筛选` disclosure. Assert `AdminContentTable.tsx` no longer renders a normal batch-operation bar in repository mode.

- [ ] **Step 2: Run failing tests**

Run: `npm run test --workspace @starry-summer/web -- src/components/admin-content-table.test.ts`

Expected: FAIL on the missing compact controls or old bulk bar.

- [ ] **Step 3: Implement compact content page**

Replace the large filter grid with a compact search row, segmented type links or select, status chips, and a `details` element for category/tag/series.

- [ ] **Step 4: Simplify table affordances**

Remove the normal-looking batch bar in repository mode. Keep selection only if it has a real local purpose; otherwise remove checkboxes. Add inline `预览` link when the item has a public route and keep `编辑`.

- [ ] **Step 5: Run focused tests**

Run: `npm run test --workspace @starry-summer/web -- src/components/admin-content-table.test.ts src/app/admin/admin-localization.test.ts`

Expected: PASS.

## Task 4: Site Maintenance Reframe

**Files:**
- Modify: `apps/web/src/components/SettingsManager.tsx`
- Modify: `apps/web/src/components/TaxonomyManager.tsx`
- Test: `apps/web/src/components/admin-detail-polish.test.ts`

- [ ] **Step 1: Add failing tests for site maintenance sections**

Assert settings source contains `公开身份`, `首页`, `外观`, `导航`, and `维护`. Assert taxonomy repository mode copy says terms are generated from content metadata and does not show create/delete controls.

- [ ] **Step 2: Run failing tests**

Run: `npm run test --workspace @starry-summer/web -- src/components/admin-detail-polish.test.ts`

Expected: FAIL until settings and taxonomy copy are reframed.

- [ ] **Step 3: Reframe settings sections**

Rename the existing sections into the five maintenance groups. Add small appearance controls for current theme/homepage configuration only where they map to existing settings; avoid adding typography knobs.

- [ ] **Step 4: Reframe taxonomy repository mode**

Make repository-mode taxonomy read-only: list terms, counts, and guidance to edit content metadata. Do not render creation forms or delete buttons in repository mode.

- [ ] **Step 5: Run focused tests**

Run: `npm run test --workspace @starry-summer/web -- src/components/admin-detail-polish.test.ts`

Expected: PASS.

## Task 5: Editor Layout Preparation

**Files:**
- Modify: `apps/web/src/components/AdminContentForm.tsx`
- Modify: `apps/web/src/components/AdminPublishSettingsPanel.tsx`
- Test: `apps/web/src/components/admin-content-form.test.ts`

- [ ] **Step 1: Add failing tests for always-visible writing controls**

Assert `AdminContentForm.tsx` keeps title/body/save/publish/preview-visible copy and uses `AdminPublishSettingsPanel` for metadata controls. Assert asset copy encourages paste or drag into Markdown.

- [ ] **Step 2: Run failing tests**

Run: `npm run test --workspace @starry-summer/web -- src/components/admin-content-form.test.ts`

Expected: FAIL until editor copy/layout is updated.

- [ ] **Step 3: Update editor composition**

Keep title and Markdown body as the default visual center. Keep save/publish actions near the writing surface. Keep metadata in the existing publish settings panel. Adjust asset unavailable copy to describe repository image paths and future paste/drag flow honestly.

- [ ] **Step 4: Run focused tests**

Run: `npm run test --workspace @starry-summer/web -- src/components/admin-content-form.test.ts`

Expected: PASS.

## Task 6: Visual Styling and Verification

**Files:**
- Modify: `apps/web/src/app/styles/admin.css`
- Modify: `apps/web/src/app/styles/responsive.css`
- Test: `apps/web/src/app/styles.test.ts`

- [ ] **Step 1: Add/update CSS contract tests**

Assert CSS contains workbench grid classes, compact filter classes, and does not force oversized hero typography on admin workbench headings.

- [ ] **Step 2: Run failing CSS tests**

Run: `npm run test --workspace @starry-summer/web -- src/app/styles.test.ts`

Expected: FAIL until classes exist.

- [ ] **Step 3: Add compact admin styles**

Add styles for `admin-workbench`, `admin-workbench-grid`, `admin-quick-create`, `admin-today-queue`, `admin-filter-bar`, and site maintenance sections. Reduce nested panel emphasis where these classes are used.

- [ ] **Step 4: Run focused CSS tests**

Run: `npm run test --workspace @starry-summer/web -- src/app/styles.test.ts`

Expected: PASS.

## Task 7: Full Verification

**Files:** No new implementation files.

- [ ] **Step 1: Run focused web tests**

Run: `npm run test --workspace @starry-summer/web`

Expected: PASS.

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`

Expected: PASS.

- [ ] **Step 3: Run build**

Run: `npm run build`

Expected: PASS.

- [ ] **Step 4: Commit and push**

Run:

```bash
git status --short
git add docs/superpowers/plans/2026-06-29-admin-light-workbench.md apps/web/src
git commit -m "feat: streamline admin workbench"
git push origin codex/admin-light-workbench
```

Expected: branch pushed successfully.
