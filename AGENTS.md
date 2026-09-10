# Aster Project Guidance

These instructions apply to the entire repository.

## Authority and Scope

- This file is the canonical project guidance. Keep tool-specific instruction files as short pointers here; historical plans, imported references, and skills must not independently redefine the product.
- Distinguish functional requirements and security safeguards from design defaults. The user's latest explicit choice takes precedence over older project preferences, subject to higher-priority instructions and safety requirements.
- Work within the requested scope. Do not rewrite working features, content, links, account identifiers, or deployment configuration merely to conform to old wording in a rule or test.
- If a rule conflicts with the requested feature, identify the concrete conflict and update the obsolete project rule when authorized. Do not silently disable the feature or invent replacement data.
- Keep communication concise: report meaningful decisions, blockers, and verification results without routine narration.
- Default to Asia/Shanghai for user-facing dates and scheduling. Preserve timestamps and timezone semantics required by APIs, storage, and CI; convert explicitly for display rather than relabeling UTC values.

## Product and Identity

- This is a single-owner personal content platform for writing, notes, moments, projects, recommendations, and reader interaction. The public brand is `Aster` and the GitHub repository is `HuangJingwang/aster`. `Starry Summer` is the former name and may remain in internal package names, local paths, backup prefixes, skill identifiers, and historical content. Do not rename those identifiers or old articles just to match the repository name.
- The owner display name is `Aster.H`. Use it for author/profile display and public author metadata. Do not introduce private real-name information into public defaults, examples, fixtures, or migrations.
- Display names and external account identifiers are separate. The owner has approved `https://github.com/HuangJingwang` and its repository links for public use. Preserve their real destinations; never construct or anonymize an account URL from `Aster` or `Aster.H`.
- Apply the same separation to other approved social profiles, project URLs, import sources, and integration identifiers. Verify destination changes against configured or user-confirmed values; do not guess a new account name.
- Privacy checks must distinguish private identity disclosure from approved public links and source attribution. Do not blanket-ban an approved username wherever it appears. If a new privacy concern arises, explain it and obtain direction instead of replacing a working link with a fake one.
- Keep existing content, recommended websites/projects, social entry points, and integrations unless the user asks to change them. Do not rewrite historical articles solely to enforce current branding or positioning.
- Public copy should reflect a personal blog/content platform. Rich motion, a cartoon avatar, and expressive project cards are compatible with that purpose; they do not by themselves turn the site into a portfolio or AI product.
- Admin surfaces default to Chinese, practical, and work-focused. Do not translate technical identifiers or break third-party integration values to satisfy the language preference.

## Design Defaults and References

- Preserve both public themes unless the user explicitly changes this requirement. Light should be readable and calm; dark should be atmospheric and readable. The earlier “cyber archive” direction is context, not a requirement to freeze fonts, colors, card radii, or layouts.
- Use the tokens and components of the affected surface. Current journal/editorial pages use `--journal-*`; use `--cyber-*` where the existing surface actually depends on them. Do not force one legacy token family across the entire site.
- For visual design, redesign, or styling work, use `design-taste-frontend` first, then `.codex/skills/starry-summer-public-theme-review/SKILL.md` before editing and again before completion. Pure URL, data, configuration, or nonvisual behavior fixes do not require an unrelated redesign or visual-reference audit.
- The user's explicitly supplied reference takes precedence. When “the reference site” is otherwise ambiguous, `https://www.yysuni.com/` and its source `https://github.com/YYsuni/2025-blog-public` are the fallback context, not the only permitted references.
- Inspect a live reference for tasks that actually borrow its visual design; inspect its source when implementation details are relevant. Do not make unrelated link, content, backend, or documentation fixes depend on browsing that reference.
- Preserve reading usability, keyboard access, visible focus, adequate contrast, compact taxonomy controls, theme-consistent forms, and reduced-motion support. Fonts, radii, accent colors, and animation styles may evolve with the approved design.

## Verification

- Match verification to the change. Documentation-only work needs consistency and referenced-path checks; skill changes also need skill validation. Link fixes need destination and regression checks, not a site-wide visual rewrite.
- For visual changes, inspect the actual affected routes at mobile and desktop widths in both applicable themes. Check overflow, text contrast, clipped controls, chips, forms, and unintended theme mismatches.
- For shared visual changes, identify actual consumers and inspect a representative route from each affected family: content (`/posts`, `/notes`, `/moments`, `/projects`), taxonomy (`/series`, `/categories`, `/tags`), interaction/archive (`/archives`, `/search`, `/guestbook`), and home/about when affected. Unrelated families need not be redesigned.
- Use TDD for behavior changes and regression fixes. Assert functional contracts, such as correct destinations and separate display identity. Do not use blanket username bans or exact instruction prose as substitutes for behavior checks.
- When an approved redesign changes a style contract, update its regression tests along with the design. Do not retain obsolete visual assertions merely to freeze an old design, or remove meaningful safety checks just to pass tests.
- Run focused checks for narrow changes. For broad application changes, run `npm test`, `npm run typecheck`, and `npm run build`. State any checks that could not be completed; do not claim deployment success from build success alone.

## Security and Delivery

- Never commit secrets, private personal data, production exports, or credentials. Approved public profile/repository URLs are not secrets. Preserve authorization, moderation, and other security behavior unless an explicitly requested change has been assessed.
- Preserve the current static-deployment workflow and integration contracts unless deployment changes are requested. Do not reintroduce removed infrastructure based on historical setup documentation.
- After modifying tracked repository files, verify, create a focused commit, and push the current branch unless the user says not to push. This preference does not authorize force pushes, unrelated changes, or additional external mutations. Ignored scratch files do not trigger this requirement.
- Never revert or stage unrelated user changes. Keep commits focused and report blockers when safe delivery requires additional authorization.
