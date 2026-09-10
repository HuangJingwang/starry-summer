---
name: starry-summer-public-theme-review
description: Review visual changes to Starry Summer public pages and shared reader styles across light and dark themes. Use for layout, typography, motion, forms, and visual regressions; not for pure URL, content-data, configuration, or nonvisual behavior fixes.
---

# Public Theme Review

Use the repository root `AGENTS.md` as the authority for current product direction, identity, references, and delivery. This skill checks visual coherence; it does not add separate privacy rules or permission to rewrite content and external links. Admin-only work is outside its scope unless shared styling affects public pages.

## Before Editing

- Read the brief with `design-taste-frontend`, then identify the actual surface and its current design system. Journal/editorial pages use `--journal-*`; retain `--cyber-*` where legacy surfaces still depend on it. Do not impose legacy tokens on a new design.
- Preserve the user's approved typography, avatar, motion, and content unless the requested change concerns them. “Content-first” allows expressive visuals when reading and navigation remain usable.
- Map consumers of changed shared CSS/components before editing. A local page change does not require redesigning unrelated routes.
- Keep both themes working unless the user explicitly changes that requirement. Treat prior colors, radii, and “cyber archive” styling as design context, not immutable values.

## Review the Rendered Result

Inspect the affected local route at mobile and desktop widths in both applicable themes. For shared changes, select a representative from each affected family:

- Content lists: `/posts`, `/notes`, `/moments`, `/projects`.
- Taxonomy: `/series`, `/categories`, `/tags`.
- Archives and interaction: `/archives`, `/search`, `/guestbook`.
- Entry and identity pages: `/`, `/about`, when affected.

Check outcomes rather than enforcing a fixed aesthetic:

- No horizontal overflow, overlapping text, clipped controls, or accidental card-height shifts.
- Readable headings, metadata, excerpts, inputs, and empty states in each theme.
- Panels and forms match the active design system. Light surfaces are valid in the light theme; flag unintended theme mismatches, not the mere presence of white.
- Tags and taxonomy chips remain compact and usable rather than stretching into tall ovals.
- Keyboard navigation and focus remain visible; hover interactions have usable touch/keyboard alternatives.
- Motion respects reduced-motion preferences and does not obstruct reading or navigation.
- Existing links, content, and interactions still work. A display-name or styling adjustment must not rewrite account identifiers or destinations.

## Verification and Handoff

Use focused tests for the changed component or behavior. For repeated regressions, add durable checks for the actual failure; avoid locking instructions, arbitrary copy, or legacy style values into tests. Update style assertions when the user approves a new design without dropping accessibility or functional coverage.

Follow root `AGENTS.md` for broader verification and delivery. Before completion, review this checklist again and report the routes/themes actually inspected and any remaining limits. Reading CSS or passing a build alone is not visual verification.
