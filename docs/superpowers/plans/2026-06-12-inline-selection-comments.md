# Inline Selection Comments Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Feishu-style inline selection comments for article detail pages by extending existing public comments with optional anchor metadata.

**Architecture:** Store selection anchors on existing comment records, reuse GitHub reader login and moderation, and render approved anchored comments through a client-side inline comment layer. The frontend keeps anchor creation and matching in a pure helper so DOM behavior can stay small and testable.

**Tech Stack:** NestJS, PostgreSQL migrations, Next.js App Router, React client components, Vitest, TypeScript.

---

## File Structure

- Create `packages/database/migrations/0013_inline_comment_anchors.sql`: adds nullable anchor columns and an index to `comments`.
- Modify `apps/api/src/interactions/interactions.service.ts`: adds `CommentAnchor`, `CreateCommentInput.anchor`, validation, and record typing.
- Modify `apps/api/src/interactions/interactions.repository.ts`: stores and returns anchors in the in-memory repository.
- Modify `apps/api/src/interactions/postgres-interactions.repository.ts`: maps anchor columns and inserts anchor metadata.
- Modify `apps/api/src/interactions/interactions.controller.ts`: accepts optional `anchor` payload on `POST /comments`.
- Modify existing API tests in `apps/api/src/interactions/*.spec.ts`: cover validation and repository mapping.
- Create `apps/web/src/lib/selection-comments.ts`: pure anchor creation, hash, and matching helpers.
- Create `apps/web/src/lib/selection-comments.test.ts`: helper red/green tests.
- Modify `apps/web/src/lib/interaction-client.ts`: adds `CommentAnchorInput` and serializes optional anchors.
- Modify `apps/web/src/lib/public-comments.ts`: normalizes public anchor payloads.
- Create `apps/web/src/components/InlineCommentLayer.tsx`: client component for selection action, rail/drawer, submission, and highlight wiring.
- Modify `apps/web/src/components/ContentDetail.tsx`: loads comments once, splits regular and anchored comments, mounts the inline layer.
- Modify admin moderation components to show selected passage for anchored comments.
- Modify `apps/web/src/app/styles.css`: highlight, floating action, rail, drawer, and admin anchor styles.

## Task 1: Backend Anchor Persistence And Validation

**Files:**
- Create: `packages/database/migrations/0013_inline_comment_anchors.sql`
- Modify: `apps/api/src/interactions/interactions.service.ts`
- Modify: `apps/api/src/interactions/interactions.repository.ts`
- Modify: `apps/api/src/interactions/postgres-interactions.repository.ts`
- Modify: `apps/api/src/interactions/interactions.controller.ts`
- Test: `apps/api/src/interactions/interactions.service.spec.ts`
- Test: `apps/api/src/interactions/interactions.repository.spec.ts`
- Test: `apps/api/src/interactions/postgres-interactions.repository.spec.ts`
- Test: `packages/database/src/migrations.test.ts`

- [ ] **Step 1: Write failing service tests**

Add tests that call `createComment` with an anchor and expect the returned record to include:

```ts
anchor: {
  text: 'selected passage',
  prefix: 'before',
  suffix: 'after',
  start: 12,
  end: 28,
  hash: 'a'.repeat(64),
}
```

Also add tests for empty anchor text and invalid ranges throwing `BadRequestException`.

- [ ] **Step 2: Run service tests and verify red**

Run: `npm run test --workspace @starry-summer/api -- src/interactions/interactions.service.spec.ts`

Expected: FAIL because anchor fields are not defined or not returned.

- [ ] **Step 3: Implement service types and validation**

Add:

```ts
export interface CommentAnchor {
  text: string;
  prefix: string;
  suffix: string;
  start: number;
  end: number;
  hash: string;
}
```

Extend `CommentRecord` and `CreateCommentInput` with `anchor?: CommentAnchor`. Add a `normalizeCommentAnchor(anchor: CommentAnchor | undefined): CommentAnchor | undefined` helper enforcing the design limits.

- [ ] **Step 4: Write repository mapping tests**

Add in-memory and PostgreSQL statement tests proving `buildCommentInsert` writes anchor fields and `mapCommentRow` returns `anchor`.

- [ ] **Step 5: Run repository tests and verify red**

Run:

```bash
npm run test --workspace @starry-summer/api -- src/interactions/interactions.repository.spec.ts src/interactions/postgres-interactions.repository.spec.ts
```

Expected: FAIL until repository mapping supports anchors.

- [ ] **Step 6: Implement repository support**

Add anchor fields to `CommentRow`, map them into `CommentRecord.anchor`, include columns in `buildCommentInsert`, and carry the anchor object through the in-memory repository.

- [ ] **Step 7: Add migration**

Create migration:

```sql
alter table comments
  add column if not exists anchor_text text,
  add column if not exists anchor_prefix text,
  add column if not exists anchor_suffix text,
  add column if not exists anchor_start integer,
  add column if not exists anchor_end integer,
  add column if not exists anchor_hash text;

create index if not exists comments_anchor_visible_idx
  on comments (target_type, target_id, anchor_hash, created_at desc)
  where status = 'approved' and anchor_hash is not null;
```

- [ ] **Step 8: Run API and database tests**

Run:

```bash
npm run test --workspace @starry-summer/api -- src/interactions/interactions.service.spec.ts src/interactions/interactions.repository.spec.ts src/interactions/postgres-interactions.repository.spec.ts
npm run test --workspace @starry-summer/database -- src/migrations.test.ts
```

Expected: PASS.

## Task 2: Frontend Anchor Helpers And Comment Request

**Files:**
- Create: `apps/web/src/lib/selection-comments.ts`
- Create: `apps/web/src/lib/selection-comments.test.ts`
- Modify: `apps/web/src/lib/interaction-client.ts`
- Modify: `apps/web/src/lib/interaction-client.test.ts`
- Modify: `apps/web/src/lib/public-comments.ts`
- Modify: `apps/web/src/lib/public-comments.test.ts`

- [ ] **Step 1: Write failing helper tests**

Test:

```ts
createInlineCommentAnchor('Before selected passage after', 7, 23)
```

returns text `selected passage`, prefix `Before`, suffix `after`, finite offsets, and a 64-character hash. Also test `findAnchorRange` uses exact offsets first and falls back to matching text.

- [ ] **Step 2: Run helper tests and verify red**

Run: `npm run test --workspace @starry-summer/web -- src/lib/selection-comments.test.ts`

Expected: FAIL because the helper does not exist.

- [ ] **Step 3: Implement helper**

Implement `normalizeAnchorText`, `createInlineCommentAnchor`, `findAnchorRange`, and `splitAnchoredComments` as pure TypeScript functions.

- [ ] **Step 4: Write request and public comment tests**

Extend `buildCommentRequest` tests so an anchor object is included in JSON body. Extend public comment normalization tests so API anchor payloads become `comment.anchor`.

- [ ] **Step 5: Implement request and public normalization**

Add `CommentAnchorInput` to `interaction-client.ts`, serialize optional anchors in `buildCommentRequest`, and normalize public comment anchor fields in `public-comments.ts`.

- [ ] **Step 6: Run frontend helper/request tests**

Run:

```bash
npm run test --workspace @starry-summer/web -- src/lib/selection-comments.test.ts src/lib/interaction-client.test.ts src/lib/public-comments.test.ts
```

Expected: PASS.

## Task 3: Inline Comment Layer UI

**Files:**
- Create: `apps/web/src/components/InlineCommentLayer.tsx`
- Create: `apps/web/src/components/inline-comment-layer.test.ts`
- Modify: `apps/web/src/components/ContentDetail.tsx`
- Modify: `apps/web/src/app/styles.css`
- Modify: `apps/web/src/components/AdminContentTable.tsx` or moderation component used for comments
- Modify: relevant source tests for content detail/moderation.

- [ ] **Step 1: Write failing source tests**

Add source tests asserting `ContentDetail` imports and renders `InlineCommentLayer`, passes `reader`, and that the new component includes `inline-comment-rail`, `inline-comment-highlight`, and `buildCommentRequest`.

- [ ] **Step 2: Run source tests and verify red**

Run: `npm run test --workspace @starry-summer/web -- src/components/inline-comment-layer.test.ts src/components/public-interaction-forms.test.ts`

Expected: FAIL because the component is not created or not mounted.

- [ ] **Step 3: Implement `InlineCommentLayer`**

Create a client component that:

- receives target metadata, reader session, approved anchored comments, and `loginNextPath`;
- listens for `selectionchange` and ignores selections outside `detail__body`;
- creates an anchor from body text offsets;
- shows a floating `评论` action;
- submits `buildCommentRequest({ targetType, targetId, body, anchor })`;
- renders a desktop rail and mobile drawer with selected passage and existing anchored comments;
- marks failed/unmapped anchors as `原文已变更`.

- [ ] **Step 4: Mount layer in `ContentDetail`**

Load approved comments once, split regular and anchored comments, render regular comments in `CommentList`, and mount `InlineCommentLayer` near `.detail__body`.

- [ ] **Step 5: Add styles**

Add CSS classes:

- `.inline-comment-shell`
- `.inline-comment-highlight`
- `.inline-comment-action`
- `.inline-comment-rail`
- `.inline-comment-card`
- `.inline-comment-card--active`
- `.inline-comment-drawer`
- `.inline-comment-source`

- [ ] **Step 6: Show anchor context in admin moderation**

Extend moderation records and cards to render the selected passage when `comment.anchor` exists.

- [ ] **Step 7: Run web tests**

Run: `npm run test --workspace @starry-summer/web`

Expected: PASS.

## Task 4: Final Verification

**Files:**
- All changed files.

- [ ] **Step 1: Run focused API tests**

Run:

```bash
npm run test --workspace @starry-summer/api -- src/interactions/interactions.service.spec.ts src/interactions/interactions.repository.spec.ts src/interactions/postgres-interactions.repository.spec.ts src/interactions/interactions.controller.spec.ts
```

Expected: PASS.

- [ ] **Step 2: Run focused web tests**

Run:

```bash
npm run test --workspace @starry-summer/web -- src/lib/selection-comments.test.ts src/lib/interaction-client.test.ts src/lib/public-comments.test.ts src/components/inline-comment-layer.test.ts
```

Expected: PASS.

- [ ] **Step 3: Run typechecks**

Run:

```bash
npm run typecheck --workspace @starry-summer/api
npm run typecheck --workspace @starry-summer/web
npm run typecheck --workspace @starry-summer/database
```

Expected: PASS.

- [ ] **Step 4: Run builds**

Run:

```bash
npm run build --workspace @starry-summer/api
npm run build --workspace @starry-summer/web
npm run build --workspace @starry-summer/database
```

Expected: PASS.

- [ ] **Step 5: Browser/manual check**

Open a local article detail page, select text in the body, confirm the `评论` action appears, and confirm the inline rail/drawer is visible. If local browser automation is blocked by auth or localhost restrictions, report that limitation with the automated test/build evidence.
