# Vercel Project Notes

Starry Summer is deployed through Vercel. The repository can be connected to more than one Vercel project, but only one should be treated as canonical for production.

## Canonical Expectations

The canonical Vercel project should:

- Install dependencies from the repository root with `npm ci`.
- Build from the repository root with `npm run build`.
- Use Node.js 22 or newer.
- Keep the repository root as the effective monorepo root so workspace dev dependencies such as `typescript` are available.
- Deploy production traffic for `https://www.asterh.me`.

## Known Duplicate Project Failure Mode

On June 22, 2026, GitHub PR status showed two Vercel projects for the same branch:

- `starry-summer-web-22ae`: deployment succeeded.
- `starry-summer-web`: deployment failed.

The failed project logged:

```text
Command "cd ../.. && npm run build" exited with 127
sh: line 1: tsc: command not found
```

This indicates an external Vercel project configuration problem, not a TypeScript source error. The project was running the monorepo build without the expected workspace dependencies available.

## Recommended Manual Fix

In Vercel, choose one canonical project for this repository and production domain. For duplicate projects:

- Disable the duplicate Git integration, or remove it from required PR checks.
- Confirm the canonical project has the correct root directory and install/build commands.
- Keep environment variables only on the canonical project unless a preview-only duplicate is intentionally maintained.

Codex automation should report this condition but must not change Vercel project settings automatically.
