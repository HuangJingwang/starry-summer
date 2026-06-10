# Security Notes

Date: 2026-06-10

## npm audit

`npm audit --audit-level=moderate --registry=https://registry.npmjs.org` currently reports two moderate findings from `next@16.2.9` depending on `postcss@8.4.31` internally.

The advisory is:

- `postcss <8.5.10`: XSS via unescaped `</style>` in CSS stringify output.

Current status:

- `npm view next version` reports `16.2.9` as the latest stable version.
- `npm audit fix --force` proposes a breaking and incorrect downgrade to `next@9.3.3`.
- npm `overrides` does not replace Next's nested internal `postcss` copy cleanly in this dependency tree.

Decision:

- Keep `next@16.2.9` for now.
- Do not run `npm audit fix --force`.
- Re-check when a stable Next release newer than `16.2.9` is available.
- Avoid accepting untrusted custom CSS input until the framework dependency can be upgraded.
