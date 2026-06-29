# Admin Light Workbench Design

Date: 2026-06-29

## 1. Goal

Replan the Starry Summer admin experience so it feels like a lightweight single-owner writing workbench instead of a heavy CMS. The admin should keep Starry Summer's existing content platform scope, but make the everyday path shorter: continue writing, create content, publish, review interactions, and do occasional site maintenance without bouncing between many configuration pages.

The approved direction is writing-first. `/admin` should become the primary writing workbench. Content library, interactions, and site maintenance remain available, but they should feel secondary to the daily act of writing and publishing.

## 2. Product Constraints

- Admin surfaces remain fully Chinese, practical, dense, and work-focused.
- Public Starry Summer positioning stays a personal content platform owned by `Aster.H`.
- Do not expose or introduce the owner's real name in public settings, defaults, migrations, RSS, or public pages.
- Public theme constraints remain unchanged. This spec covers admin IA and admin interaction, not a public theme redesign.
- Starry Summer is not reduced to a single blog. It keeps posts, notes, moments, projects, guestbook, comments, assets, taxonomy, settings, and repository-driven deployment.
- Low-frequency configuration should be available, but should not dominate the default admin flow.

## 3. Reference Site Reading

The reference project `YYsuni/2025-blog-public` is lightweight because it avoids a conventional admin dashboard. The relevant patterns are:

- Most management happens through a focused write route and contextual edit controls.
- Page-level editing is accessible from the page context instead of a large global control panel.
- Blog images are handled in the writing flow: add or paste images, then drag or insert them into the editor.
- Configuration exists, but it is not the default first-screen experience.

Starry Summer should borrow those interaction ideas, not the reference site's narrower data model. Starry Summer needs a broader personal archive, so the design adapts the reference pattern into four workspaces.

## 4. Current Admin Problems

Current routes and navigation expose too many peer-level destinations:

- `/admin`
- `/admin/content`
- `/admin/projects`
- `/admin/study`
- `/admin/comments`
- `/admin/guestbook`
- `/admin/assets`
- `/admin/taxonomy`
- `/admin/settings`
- `/admin/export`

This creates three usability problems:

- The same action appears in multiple places, such as new content, upload assets, project editing, and settings entry points.
- Low-frequency maintenance pages look as important as daily writing.
- Repository mode disables several old database-style actions, but the UI still looks like a database admin surface in places.

The redesign should reduce visible choices, merge related destinations, and make disabled or repository-only behavior honest.

## 5. Proposed Information Architecture

The admin primary navigation becomes four workspaces:

| Workspace | Route | Purpose |
| --- | --- | --- |
| 写作 | `/admin` | Continue drafts, create new content, see recent work, handle urgent daily items. |
| 内容 | `/admin/content` | Search, filter, preview, and edit all content types. |
| 互动 | `/admin/comments` | Moderate comments and guestbook entries from one queue. |
| 站点 | `/admin/settings` | Maintain assets, taxonomy, import and export, profile, home copy, and public navigation. |

Existing routes can remain as compatibility targets, but the visible navigation should present these four concepts. Old routes can either redirect or render as sections inside the new workspaces.

`/admin/study` is not part of the core content platform workflow. It should move behind a secondary "工具" or "更多" entry if it remains in scope.

## 6. Workspace Details

### 写作

The admin landing page is a workbench, not a metrics dashboard.

First screen sections:

- `继续写`: recent drafts and recently edited items. Each row opens the editor directly.
- `快速新建`: compact buttons for article, note, moment, and project.
- `今日处理`: pending comments, pending guestbook entries, and recent publish or deploy notes.
- `最近内容`: the last few changed items with edit and preview actions.

The current stat-card grid should be reduced. Counts can exist as small signals, but they should not occupy the main visual weight.

### 内容

The content library is for finding and organizing existing items.

Replace the large filter form with a compact filter bar:

- Search input.
- Type segmented control: 全部, 文章, 笔记, 日常, 项目, 页面.
- Status chips: 草稿, 已发布, 私密, 已归档.
- "更多筛选" disclosure for category, tag, and series.

Rows should prioritize:

- Title and summary.
- Type and status.
- Updated label.
- Inline actions: 编辑, 预览, 复制链接, 更多.

Repository mode should remove misleading batch database actions. If a batch action cannot be executed, do not show it as a normal toolbar action.

### 互动

Merge comments and guestbook into one moderation queue.

Default view:

- Pending first.
- Toggle between 全部, 评论, 留言.
- Inline actions for approve, reject, spam, delete where supported.
- If interaction Worker is unavailable, show a quiet unavailable state rather than a heavy error panel.

Existing `/admin/comments` and `/admin/guestbook` can remain as filtered views or redirects.

### 站点

Merge low-frequency maintenance into one workspace with four compact sections:

- `公开身份`: site title, owner display name, SEO description, social links.
- `首页`: tagline, motto, quotes, fallback background.
- `导航`: public nav ordering and visibility.
- `维护`: assets, taxonomy index, import, export, repository guidance.

Taxonomy in repository mode should be honest: categories, tags, and series are derived from content metadata. The taxonomy page should become a read-only index with links to matching content and guidance to edit metadata on content items.

Assets should be useful inside writing first. A standalone asset view can remain for cleanup and inspection.

## 7. Editor Interaction

The editor default state should be quiet and writing-focused.

Always visible:

- Title.
- Markdown body.
- Save draft.
- Publish.
- Preview toggle.
- Unsaved/local draft status.

Moved into the right-side publish settings drawer:

- Content type.
- Slug.
- Summary.
- SEO title.
- SEO description.
- Visibility.
- Status.
- Categories.
- Tags.
- Series.
- Cover.
- Comments allowed.
- Pinned and featured.
- Project metadata when content type is project.

The publish settings drawer opens when publishing, when the user clicks "发布设置", or when validation needs metadata.

### Image Flow

The writing flow should prefer direct image insertion:

- Paste image into Markdown editor.
- Drag image into Markdown editor.
- Insert from current content's asset tray.
- Set selected image as cover from the same tray.

The standalone asset manager becomes a maintenance view, not the first stop for writing with images.

## 8. Contextual Actions

The global command bar should stop showing the same fixed actions everywhere.

Recommended command bar behavior:

- 写作: 新建, 打开内容库, 查看前台.
- 内容: 新建, 清除筛选, 查看前台.
- 互动: 只看待处理, 刷新, 查看留言页.
- 站点: 打开配置文件提示, 导出内容, 查看前台.
- 编辑器: 保存草稿, 发布, 预览, 更多.

The sidebar should no longer need a second-level subnav for common cases. Secondary links belong inside the workspace content.

## 9. Visual Direction

The admin should keep the cyber archive atmosphere, but reduce visual heaviness.

Guidelines:

- Fewer nested panels.
- Smaller page headings inside admin.
- Less hero-scale typography.
- Prefer rows, lists, and compact sections over large repeated cards.
- Keep dark admin theme readable and practical.
- Use cyan/teal accents as operational focus states, not decoration everywhere.
- Use compact chips and segmented controls for filters.

The result should feel like a personal console for daily writing, not a product analytics dashboard.

## 10. Data Flow and Compatibility

No content model change is required for the first implementation pass.

Existing loaders can remain:

- `loadRepositoryAdminContentItems`
- `buildAdminOverviewSnapshot`
- `buildAdminContentDashboard`
- `loadAdminModerationCount`
- `loadSiteSettings`
- taxonomy builders from content metadata

The initial redesign is mostly composition and interaction:

- Recompose admin navigation.
- Recompose admin dashboard into writing workbench.
- Recompose content filters.
- Recompose settings and taxonomy as site maintenance sections.
- Keep old routes working while reducing visible navigation.

## 11. Error, Empty, and Repository States

The redesign should avoid presenting disabled backend features as normal controls.

States:

- No drafts: show quick create buttons and a short empty note.
- No matching content: show clear filters and a reset action.
- Interaction Worker unavailable: show a quiet unavailable state with no false counts.
- Repository mode: show guidance near the affected action, not as repeated warning cards across the whole page.
- Local draft exists: show recover and discard actions directly above the editor.

## 12. Testing Plan

Add or update tests around durable behavior and structure:

- Admin navigation exposes four primary workspaces.
- Writing workbench includes continue writing, quick create, today queue, and recent content sections.
- Content filters include search, type segmented controls, status chips, and more filters disclosure.
- Repository mode does not show misleading batch database actions as normal enabled controls.
- Taxonomy repository mode is presented as a derived read-only index.
- Editor keeps title and body always visible and moves metadata into publish settings.
- Admin visible copy remains Chinese.

Visual verification should include:

- `/admin`
- `/admin/content`
- `/admin/content/new`
- one edit route under `/admin/content/[id]`
- `/admin/settings` or the new site maintenance route
- the interaction queue route

Check for horizontal overflow, nested card clutter, unreadable low-contrast text, and oversized chips.

## 13. Implementation Sequence

1. Update admin navigation and shell language to the four-workspace model.
2. Rework `/admin` into the writing workbench while reusing existing overview data.
3. Simplify `/admin/content` filters and table actions.
4. Merge comments and guestbook into one interaction workspace or visible nav entry.
5. Reframe settings, assets, taxonomy, and export under site maintenance.
6. Refine editor layout so publish metadata lives in the right-side drawer.
7. Add paste and drag image insertion if existing asset plumbing can support it safely in the same pass; otherwise keep it as the next focused implementation after layout.
8. Run tests, typecheck, build, and visual route checks.

## 14. Non-Goals

- Do not remove existing content types.
- Do not redesign public themes.
- Do not introduce multi-user admin roles.
- Do not rebuild the persistence model.
- Do not copy the reference site's single-blog data structure.
- Do not expose disabled database operations as if they are available.

## 15. Implementation Defaults

- Keep `/admin/settings` as the visible site workspace route. Avoid introducing `/admin/site` in the first pass.
- Use `/admin/comments` as the visible interaction workspace route. `/admin/guestbook` becomes a filtered view or compatibility route.
- The first implementation pass should finish the IA, layout, and editor drawer redesign. Drag and paste image insertion is the next focused pass unless the existing asset save path can be reused without expanding scope.
- Move `/admin/study` out of primary navigation. If retained, expose it from a secondary "更多" area rather than as a main workspace.
