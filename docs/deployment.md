# Deployment Guide

This project targets a self-managed cloud server using Docker Compose, Caddy, PostgreSQL, Redis, and MinIO or an S3-compatible object store.

## 1. Server Prerequisites

- A Linux cloud server with Docker and Docker Compose.
- A domain pointing to the server public IP.
- Ports `80` and `443` open.
- At least 2 GB RAM for the first deployment.

## 2. Environment Setup

For local Docker previews, generate `.env` with a local admin password:

```bash
npm run ops:init-env -- "your local admin password"
```

The initializer copies `.env.example`, replaces the admin password hash, `SESSION_SECRET`, and `INTERACTION_HASH_SECRET`, and refuses to overwrite an existing `.env` unless `INIT_ENV_OVERWRITE=YES` is set.

For production, copy `.env.example` to `.env` and change production values:

```bash
cp .env.example .env
```

Required production changes:

- `DOMAIN`: your public domain, for example `blog.your-domain.com`.
- `PUBLIC_SITE_URL`: `https://blog.your-domain.com`. This value is used by `robots.txt`, `sitemap.xml`, RSS, canonical links, and Open Graph metadata.
- `ACME_EMAIL`: email used by Caddy for HTTPS certificates.
- `SESSION_SECRET`: a long random string.
- `INTERACTION_HASH_SECRET`: a long random string used to anonymize and deduplicate public likes/views.
- `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`: GitHub OAuth App credentials used for reader login before guestbook submissions.
- `ADMIN_EMAIL`: owner login email.
- `ADMIN_PASSWORD_HASH`: a strong password hash generated before first real login.
- `POSTGRES_PASSWORD`: a strong database password.
- `S3_ACCESS_KEY` and `S3_SECRET_KEY`: strong MinIO credentials when self-hosting MinIO.
- `STORAGE_DRIVER`: use `local` for single-server disk uploads or `s3` for MinIO/S3-compatible object storage.
- `S3_PUBLIC_BASE_URL`: public asset base URL when `STORAGE_DRIVER=s3`, for example `https://assets.your-domain.com/starry-summer` or a CDN URL.
- `S3_FORCE_PATH_STYLE`: keep `true` for self-hosted MinIO and most S3-compatible services; set `false` only for providers that require virtual-hosted bucket URLs.
- RELEASE_VERSION and GIT_REVISION are returned by `/health` and `/api/health` so you can confirm which release is live after deployment.

Check the production environment before first boot:

```bash
npm run ops:doctor
```

Generate the admin password hash locally, then paste the printed value into `.env`:

```bash
npm run auth:hash-password -- "your strong password"
```

Generate a session secret the same way:

```bash
npm run auth:secret
```

Generate the public interaction hash secret separately:

```bash
npm run auth:interaction-secret
```

Create a GitHub OAuth App for reader login:

- Homepage URL: the same value as `PUBLIC_SITE_URL`.
- Authorization callback URL: `https://blog.your-domain.com/api/auth/github/callback`.
- Paste the Client ID and Client Secret into `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`.

## 3. First Boot

Build the images and run migrations first:

```bash
npm run ops:docker-preflight
docker compose build
docker compose run --rm migrate
docker compose up -d
```

Check service status:

```bash
docker compose ps
docker compose logs -f web api caddy
```

Verify:

- `https://$DOMAIN` opens the public site.
- `https://$DOMAIN/health` returns Web health through Caddy.
- `https://$DOMAIN/admin/login` opens the admin login screen.
- `https://$DOMAIN/api/health` returns API health through Caddy.

API health also verifies PostgreSQL and Redis when production drivers are configured.

Run the public smoke check after DNS and HTTPS are ready:

```bash
npm run ops:smoke -- https://blog.your-domain.com
```

For later schema changes, rerun migrations before restarting the API:

```bash
docker compose run --rm migrate
```

Production Docker Compose uses `CONTENT_REPOSITORY_DRIVER=postgres`. Local development can set `CONTENT_REPOSITORY_DRIVER=memory` until PostgreSQL is running.

## 4. Backup

Create a timestamped operational backup:

```bash
npm run ops:backup
```

This writes a directory such as `backups/starry-summer-2026-06-11-030000` containing:

- `postgres.sql`: PostgreSQL dump.
- `api-uploads.tar.gz`: uploaded files when using local uploads.
- `minio-data.tar.gz`: self-hosted MinIO data when the local Compose volume exists.
- `manifest.txt`: timestamp, Compose project name, SHA-256 checksums, and git revision.

You can pass a fixed output directory:

```bash
npm run ops:backup -- backups/starry-summer-before-upgrade
```

For cloud S3/OSS, also enable provider lifecycle and backup policies.

Markdown export:

- Use `/admin/export` to export all content as a portable Markdown archive.
- Keep exports outside the server as a portable content archive.
- Use the same `/admin/export` screen to import a Starry Summer Markdown archive back into the platform. Imported content is restored as drafts first, while public/private visibility from the archive is preserved.

## 5. Restore

Restore from an operational backup:

```bash
RESTORE_CONFIRM=YES npm run ops:restore -- backups/starry-summer-YYYY-MM-DD
```

The restore script imports `postgres.sql` into PostgreSQL and restores `api-uploads` and `minio-data` archives when those files are present.
It also checks the backup manifest's Compose project name before restoring. For an intentional cross-project restore, rerun with `RESTORE_ALLOW_PROJECT_MISMATCH=YES`.

After restore, run:

```bash
docker compose up -d
docker compose ps
```

Then confirm uploaded images load from public pages.

Restore from Markdown when you do not want to restore the whole database:

- Log in to `/admin/export`.
- Paste the full archive exported by `Export all`.
- Use `Import archive` to recreate every content item as a draft, then review and publish from `/admin/content`.

## 6. Updates

Pull the latest code, rebuild, migrate, restart, and run smoke checks in one step:

```bash
git pull
npm run ops:deploy -- https://blog.your-domain.com
```

The deploy script runs `ops:doctor`, exports release metadata for `/health` and `/api/health`, builds images, runs migrations, starts the stack, and then runs `ops:smoke`.

By default, the deploy script refuses to run with uncommitted local changes so the live `GIT_REVISION` remains traceable. For an intentional emergency deploy from a dirty worktree, use:

```bash
ALLOW_DIRTY_DEPLOY=true npm run ops:deploy -- https://blog.your-domain.com
```

You can also run the underlying commands manually:

```bash
git pull
docker compose build
docker compose run --rm migrate
docker compose up -d
```

Check logs after deployment:

```bash
docker compose logs -f web api caddy
```

## 7. Production Notes

- Do not use default MinIO, PostgreSQL, or session credentials.
- Keep `.env` out of git.
- Run `npm run db:migrate` after schema changes and before deploying API code that depends on them.
- Use an external managed object store if the server has limited disk space.
- Keep regular off-server backups.
