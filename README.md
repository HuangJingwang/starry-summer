# Starry Summer

Starry Summer is a personal content platform for articles, notes, moments, projects, comments, likes, view counts, guestbook messages, and Markdown-based content ownership.

The product is designed as a single-owner platform first, with a public website, private admin area, API service, PostgreSQL persistence, Redis support, object storage, and Docker-based cloud server deployment.

## Workspace

```text
apps/
  web/  Public site and admin UI
  api/  Backend API
packages/
  shared/    Shared domain contracts
  markdown/  Markdown parsing and rendering helpers
docs/
  superpowers/specs/
  superpowers/plans/
```

## Scripts

```bash
npm install
npm run dev:web
npm run dev:api
npm test
npm run typecheck
npm run build
```

## Current Status

The project is being implemented from the approved design in `docs/superpowers/specs/2026-06-10-personal-content-platform-design.md`.
