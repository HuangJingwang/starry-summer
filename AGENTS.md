# Starry Summer Agent Constraints

These instructions apply to the entire repository.

## Constraint Authority

- This `AGENTS.md` is the canonical instruction source for Starry Summer.
- Do not create or maintain separate product-positioning instructions in subdirectories. If a tool requires a local `CLAUDE.md`, `GEMINI.md`, or similar file, keep it as a short pointer back to this file.
- Older generated, imported, or experimental directories remain subordinate to this file. Their local notes must not redefine Starry Summer as a portfolio, AI product, recruiting site, or design showcase.

## Product Direction

- Starry Summer is a single-owner personal content platform for long-term public writing, notes, moments, projects, comments, guestbook entries, assets, and deployment.
- The public site should feel like a dark cyber archive: quiet, personal, atmospheric, readable, and content-first.
- Admin surfaces should be fully Chinese, practical, dense, and work-focused.
- The public owner display name is `Aster.H`. Do not expose, seed, test for, or render the owner's real name on public webpages, RSS metadata, default settings, or database migrations.
- Public profile copy should describe Starry Summer as a personal content platform, not as an AI product, design portfolio, recruiting portfolio, or personal showcase for AI/design abilities.

## Reference Site Context

- When the user mentions the reference site, reference website, or upstream reference project, treat it as `https://www.yysuni.com/`.
- The reference site's source repository is `YYsuni/2025-blog-public` at `https://github.com/YYsuni/2025-blog-public`.
- For public homepage layout, card composition, motion, and image treatment requests, compare against the live reference site and, when implementation details matter, inspect the source repository before editing.
- Preserve Starry Summer's product direction, public owner display name, content model, and theme guardrails even when borrowing layout or interaction ideas from the reference site.

## Visual Design Guardrails

- For any frontend coding, redesign, or public UI styling task in this repository, use the global Codex skill `design-taste-frontend` before planning or editing. Treat it as an additional design-quality and anti-template check; Starry Summer's product direction, owner-name constraints, and public theme guardrails in this file remain higher priority.
- When changing or reviewing public page visuals, global public CSS, shared reader components, public forms, or taxonomy/search/archive/guestbook layouts, use the repository skill at `.codex/skills/starry-summer-public-theme-review/SKILL.md` before editing and before reporting completion.
- Public reader pages such as home, posts, notes, moments, projects, series, categories, tags, archives, search, guestbook, and about must preserve both public themes unless the user explicitly asks for a different theme: light should stay clean, quiet, readable, and content-first; dark should keep the cyber/glass archive atmosphere.
- Do not mix the old light card system into public pages. Avoid harsh white panels, mismatched form blocks, low-contrast headings, and pale taxonomy chips. In dark theme, use the existing `--cyber-*` tokens, translucent dark panels, subtle borders, and cyan/teal accents.
- When changing a shared component or shared selector such as `ContentCard`, `.content-card`, `.page-main`, `.category-section`, `.archive-list`, `.search-form`, or `.guestbook-form`, check every page family that reuses it. A fix for one page must not leave series/categories/tags/archives with a mismatched style.
- Tags, series chips, and taxonomy pills must remain compact inline controls. They must not stretch into tall vertical ovals or resize cards unexpectedly.
- Forms on public pages must match the active theme, with readable inputs, visible focus states, and theme-consistent buttons. Never leave a bright white public form on a dark page or a heavy dark form on a light page.
- Public page headings must have readable contrast. Eyebrows should use the established mono/cyan treatment; titles should not disappear into the background.
- Keep cards at 8px radius or less only where the existing system calls for utility/admin cards. Public cyber/glass cards may use the established larger radii already present in the design.

## Frontend Verification

- For frontend visual changes, verify the actual affected local route, not only the component that was edited.
- If a style is shared, verify at least one representative page from each affected family:
  - content lists: `/posts`, `/notes`, `/moments`, `/projects`
  - taxonomy lists: `/series`, `/categories`, `/tags`
  - archive/search/interaction pages: `/archives`, `/search`, `/guestbook`
- Before reporting a visual fix, check for horizontal overflow, unreadable low-contrast text, oversized chips, and accidental white panels.
- Add or update tests for durable style contracts when a repeated visual regression is fixed.

## Development Workflow

- Use TDD for behavior changes and regression fixes.
- Keep commits focused. Do not mix unrelated worktree changes into a commit.
- After modifying code or repository files, run the appropriate verification, create a focused commit, and push the current branch directly unless the user explicitly says not to push.
- Run the appropriate verification before claiming completion. For broad app changes, use:
  - `npm test`
  - `npm run typecheck`
  - `npm run build`
- The repository may have unrelated dirty files. Never revert or stage changes you did not intentionally make for the current task.
