---
name: starry-summer-public-theme-review
description: Use when changing or reviewing Starry Summer public UI, CSS, route layout, shared reader components, forms, taxonomy pages, search, archives, guestbook, home, about, posts, notes, moments, projects, series, categories, tags, or light and dark public themes.
---

# Starry Summer Public Theme Review

## Overview

Keep Starry Summer's public site coherent across both themes. The light theme should stay clean, quiet, readable, and content-first; the dark theme should keep the cyber archive and glass atmosphere without becoming low-contrast or decorative at the expense of reading.

Admin UI is out of scope except where shared components leak into public pages.

## Theme Contract

Preserve these constraints unless the user explicitly asks to redesign the public theme system:

- Public pages support light and dark public themes. Do not treat the public site as dark-only.
- The light theme should avoid harsh white slabs, mismatched card systems, and washed-out metadata.
- The dark theme should use the established cyber archive visual language: dark translucent panels, subtle borders, readable headings, and cyan or teal accents.
- Do not mix the old light card system into either theme. Avoid white panels, white form blocks, white content cards, pale chips, and low-contrast headings on public reader surfaces.
- Tags, series pills, category links, and taxonomy chips must remain compact inline controls. They must not stretch into tall ovals, wrap awkwardly, or resize cards unexpectedly.
- Forms on public routes must match the active theme, with readable labels, dark or light inputs as appropriate, visible focus states, and theme-consistent buttons.
- Public copy and metadata must use the owner display name `Aster.H`. Never introduce or expose the owner's real name in public pages, RSS metadata, default settings, tests, or migrations.

## Before Editing

First map the blast radius:

1. Identify whether the change touches shared selectors or shared components such as `ContentCard`, `.content-card`, `.page-main`, `.category-section`, `.archive-list`, `.search-form`, `.guestbook-form`, `PublicPageLayout`, or global public CSS.
2. If a shared selector is touched, list every affected route family before editing.
3. Use TDD for durable regression fixes: add or update tests before changing behavior when repeated visual contracts can be checked in code.

## Visual Review Checklist

For any public visual change, verify the actual affected route, not only the component. For shared CSS or shared reader components, verify at least one route from each affected family:

- Content lists: `/posts`, `/notes`, `/moments`, `/projects`
- Taxonomy lists: `/series`, `/categories`, `/tags`
- Archive, search, and interaction pages: `/archives`, `/search`, `/guestbook`
- Identity and entry pages when relevant: `/`, `/home`, `/about`

Check both light and dark public themes when the changed CSS, component, or layout can appear in both. Do not report completion until these have been inspected:

- No horizontal overflow at mobile and desktop widths.
- No accidental white panels or old light card system artifacts.
- No unreadable low-contrast text, especially headings, dates, excerpts, and empty states.
- No oversized taxonomy chips, stretched pills, or card height shifts caused by tags.
- No public forms that visually detach from the active theme.
- No text overlap, clipped labels, or controls whose contents do not fit.

## Verification

Use focused checks first, then broader checks when the change touches shared public UI:

```bash
npm run test --workspace @starry-summer/web -- src/app/styles.test.ts
npm test
npm run typecheck
npm run build
```

When visual behavior changed, also inspect the rendered local routes with a browser or screenshot workflow. Record the routes and themes checked in the final response.

## Common Mistakes

- Treating "cyber archive" as meaning dark-only. Starry Summer has light and dark public themes.
- Fixing `/posts` and forgetting taxonomy or archive pages that reuse the same selector.
- Styling public forms as bright default browser blocks on themed pages.
- Making chips visually prominent enough that they dominate cards.
- Reporting a visual fix after only reading CSS. Always verify rendered routes for visual work.
