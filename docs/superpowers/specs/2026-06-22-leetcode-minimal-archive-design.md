# LeetCode Minimal Archive Design

## Context

The public `/leetcode` page currently reads `apps/web/content/leetcode/dashboard.json` and renders a complete study archive: summary metrics, today tasks, review tasks, notes, five review rounds, heatmap, categories, and recent submissions. The next version should make the page feel more like the home page: dark, quiet, atmospheric, and content-first, with simple cards that surface only the most useful study signals.

The approved direction is a minimal snapshot with clickable drill-down entry points. Browser feedback selected the minimal snapshot direction, then refined it toward a quieter treatment: fewer button-like panels, lighter borders, and entry points that feel like compact links or chips.

## Considered Approaches

### A. Core Dashboard

This option foregrounds completion rate, today plan, review rhythm, and sync state in a denser dashboard. It is practical, but too close to the current all-in-one dashboard and less calm than the requested minimal page.

### B. Archive Story

This option treats LeetCode practice as a narrative learning log. It fits the personal archive mood, but it hides the actionable study data behind too much prose.

### C. Minimal Snapshot With Quiet Entry Points

This is the chosen approach. The page opens with one large progress signal and a small set of linked stats. Deeper information remains available through anchors for today, review rounds, heatmap, categories, and recent submissions. The visual weight stays low: dark glass panels, compact chips, mono labels, and restrained cyan accents.

## Page Structure

The page keeps using `SiteShell` and the public dark cyber archive background. It should not introduce white cards or a separate visual system.

The first viewport contains:

- A short title block: `LeetCode Trace` / `算法练习快照`, with one sentence explaining Hot100, review rounds, and recent sync.
- A primary progress module showing completion rate and done rounds. This links to the review rounds section.
- Three compact linked stats:
  - Today: new/review plan, linking to today's tasks.
  - Streak: streak and total days, linking to heatmap.
  - Types: category count, linking to category progress.
- A quiet review-round strip with `R1` to `R5`, each linking to the review rhythm area.

Below the first viewport:

- Today focus: compact new-problem and due-review links. Empty state stays short and calm.
- Review rhythm: five small progress rows or chips for `R1` to `R5`.
- Category progress: compact category chips or rows. Categories are clickable anchors or filters within the section when local filtering is added; for the first implementation they may link to the category section itself and expose the category name in the URL hash.
- Activity: recent 12-week heatmap and recent submissions, both visually secondary.

## Interaction

All headline stats should be real links, not decorative cards:

- Completion rate links to `#review-rhythm`.
- Today plan links to `#today-plan`.
- Streak links to `#activity`.
- Category count links to `#categories`.
- Round chips link to `#review-rhythm`.
- Problem cards link to their LeetCode problem URL in a new tab.
- Recent submissions link to their LeetCode problem URL in a new tab.

For categories, the implementation should support stable hash links such as `#category-dynamic-programming` or a scoped `#categories` fallback. If category-specific filtering is expensive, keep the first version as section anchors rather than adding client state.

## Typography

Use the existing site font strategy and avoid adding a heavy Chinese font dependency unless already present in the app. The visual direction is:

- Chinese and body copy: system sans stack, optionally naming `Noto Sans SC` in the fallback list for users who have it installed.
- English labels and technical tags: existing mono stack (`SFMono-Regular`, Consolas, `Liberation Mono`, monospace).
- Numeric metrics: same sans stack with strong weight; avoid extra display fonts for the dashboard data.

The root layout currently loads `Averia Gruesa Libre` for the home personality. The LeetCode page should not depend on it for data readability, but can inherit the broader home atmosphere through layout, background, and accent treatment.

## Visual Rules

- Keep the page dark by default and aligned with the public cyber/glass language.
- Make cards quieter than the current dashboard: fewer nested panels, lower border contrast, no oversized button styling.
- Keep chips compact and inline. They must not stretch vertically or resize surrounding cards.
- Use cyan/teal accents sparingly for labels, focus states, progress, and hover.
- Avoid bright white panels, pale taxonomy chips, and low-contrast headings.
- Keep responsive dimensions stable so metric text, chips, and progress rows do not cause layout shifts.

## Data Flow

No new backend endpoint or data file is required. The page continues to load:

```ts
const { dashboard } = await loadRepositoryStudyDashboard();
```

Derived values should stay local to `apps/web/src/app/leetcode/page.tsx` unless they become broadly reusable:

- `roundTrack` from current problem rounds and summary fallback.
- `heatmapDays` from `buildStudyHeatmapWindow`.
- Category anchors from category names.
- Empty-state labels from existing settings and summary values.

## Testing

Add or update tests in `apps/web/src/app/leetcode/leetcode-page.test.ts` for durable page contracts:

- The page still uses `loadRepositoryStudyDashboard`.
- The page does not use API fallback or `ContentCard`.
- The page exposes anchors for `#today-plan`, `#review-rhythm`, `#categories`, and `#activity`.
- Completion, today, streak, and category summary stats render as links.
- The page keeps `study-heatmap` and round-track content.
- The source does not reintroduce old heavy classes such as `study-command-grid`, `study-task-board`, or `study-progress-orb`.

Visual verification should run the local `/leetcode` route and check:

- No accidental white panels.
- No horizontal overflow on mobile.
- Headings and muted text are readable.
- Chips remain compact.
- The first viewport feels like a minimal archive snapshot, not a dense admin dashboard.

## Out Of Scope

- Changing LeetCode sync, API behavior, or repository dashboard schema.
- Adding client-side category filtering unless it is trivial and does not require new state architecture.
- Changing admin study pages.
- Reworking shared public components used by posts, notes, tags, categories, archives, search, or guestbook.
