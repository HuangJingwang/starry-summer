# Starry Summer

Starry Summer is a single-owner personal content platform for articles, notes, moments, projects, comments, likes, view counts, guestbook messages, and Markdown-based content ownership.

It is designed as a public personal site plus a private admin console. The V1 direction is a calm, information-rich blog system that can run on a cloud server with Docker Compose and grow into a larger personal publishing platform over time.

## Features

- Public pages for posts, notes, moments, projects, archives, tags, categories, series, search, guestbook, RSS, sitemap, and about.
- Admin login and protected management pages for content, taxonomy, assets, comments, guestbook moderation, settings, projects, and Markdown import/export.
- Content lifecycle with drafts, published posts, private content, archived content, comments, likes, and view counts.
- Markdown rendering pipeline shared between authoring and public reading.
- PostgreSQL persistence, Redis support, local uploads, MinIO/S3-compatible object storage, and Docker Compose deployment.
- Production checks for environment safety, smoke testing, backup, restore, checksum verification, and repeatable deployment.

## Stack

- Next.js and React for the public site and admin UI.
- NestJS for the API service.
- PostgreSQL for content, taxonomy, assets, settings, and interactions.
- Redis for cache-oriented production health and future job support.
- Docker Compose and Caddy for single-server deployment.
- TypeScript workspaces for shared domain, database, and Markdown packages.

## Repository Layout

```text
apps/
  web/  Public site and admin UI
  api/  Backend API
packages/
  shared/    Shared domain contracts
  markdown/  Markdown parsing and rendering helpers
  database/  Database migrations and deployment checks
infra/
  caddy/     Reverse proxy configuration
scripts/    Backup, restore, deploy, doctor, and smoke checks
docs/
  deployment.md
  security.md
  superpowers/
```

## Getting Started

Requirements:

- Node.js 22 or newer.
- npm 10 or newer.
- Docker and Docker Compose for the full production-like stack.

Install dependencies:

```bash
npm install
```

Run the web and API apps during development:

```bash
npm run dev:web
npm run dev:api
```

Copy the environment example before production-style runs:

```bash
cp .env.example .env
```

Generate secrets and the admin password hash:

```bash
npm run auth:secret
npm run auth:interaction-secret
npm run auth:hash-password -- "your strong password"
```

## Verification

Run the main checks:

```bash
npm test
npm run typecheck
npm run build
npm run ops:docker-preflight
docker compose config --quiet
```

Operational scripts are covered by:

```bash
npm run test:ops
```

## Deployment

The production path targets a self-managed cloud server with Docker Compose, Caddy, PostgreSQL, Redis, and local or S3-compatible storage.

Start with:

```bash
npm run ops:doctor
npm run ops:docker-preflight
npm run ops:deploy -- https://blog.your-domain.com
```

Backups and restores:

```bash
npm run ops:backup
RESTORE_CONFIRM=YES npm run ops:restore -- backups/starry-summer-YYYY-MM-DD
```

The backup manifest records Compose project identity and SHA-256 checksums, and restore validates them before touching PostgreSQL or Docker volumes.

See [docs/deployment.md](docs/deployment.md) for the full server setup and operational runbook.

## Status

This project is under active development from the approved product design in [docs/superpowers/specs/2026-06-10-personal-content-platform-design.md](docs/superpowers/specs/2026-06-10-personal-content-platform-design.md).

The current focus is completing a production-ready V1 for a personal public blog with a private owner-only admin area.
