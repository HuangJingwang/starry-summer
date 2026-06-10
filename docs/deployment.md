# Deployment Guide

This project targets a self-managed cloud server using Docker Compose, Caddy, PostgreSQL, Redis, and MinIO or an S3-compatible object store.

## 1. Server Prerequisites

- A Linux cloud server with Docker and Docker Compose.
- A domain pointing to the server public IP.
- Ports `80` and `443` open.
- At least 2 GB RAM for the first deployment.

## 2. Environment Setup

Copy `.env.example` to `.env` and change production values:

```bash
cp .env.example .env
```

Required production changes:

- `DOMAIN`: your public domain, for example `example.com`.
- `PUBLIC_SITE_URL`: `https://example.com`. This value is used by `robots.txt`, `sitemap.xml`, RSS, canonical links, and Open Graph metadata.
- `ACME_EMAIL`: email used by Caddy for HTTPS certificates.
- `SESSION_SECRET`: a long random string.
- `ADMIN_EMAIL`: owner login email.
- `ADMIN_PASSWORD_HASH`: a strong password hash generated before first real login.
- `POSTGRES_PASSWORD`: a strong database password.
- `S3_ACCESS_KEY` and `S3_SECRET_KEY`: strong MinIO credentials when self-hosting MinIO.
- `STORAGE_DRIVER`: use `local` for single-server disk uploads or `s3` for MinIO/S3-compatible object storage.
- `S3_PUBLIC_BASE_URL`: public asset base URL when `STORAGE_DRIVER=s3`, for example `https://assets.example.com/starry-summer` or a CDN URL.
- `S3_FORCE_PATH_STYLE`: keep `true` for self-hosted MinIO and most S3-compatible services; set `false` only for providers that require virtual-hosted bucket URLs.

Generate the admin password hash locally, then paste the printed value into `.env`:

```bash
npm run auth:hash-password -- "your strong password"
```

Generate a session secret the same way:

```bash
npm run auth:secret
```

## 3. First Boot

Build the images and run migrations first:

```bash
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
- `https://$DOMAIN/admin/login` opens the admin login screen.
- `https://$DOMAIN/api/health` returns API health through Caddy.

For later schema changes, rerun migrations before restarting the API:

```bash
docker compose run --rm migrate
```

Production Docker Compose uses `CONTENT_REPOSITORY_DRIVER=postgres`. Local development can set `CONTENT_REPOSITORY_DRIVER=memory` until PostgreSQL is running.

## 4. Backup

PostgreSQL dump:

```bash
docker compose exec postgres pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > backups/starry-summer-$(date +%F).sql
```

MinIO data:

- For self-hosted MinIO, back up the `minio-data` Docker volume or configure object replication.
- For cloud S3/OSS, enable provider lifecycle and backup policies.
- Back up the `api-uploads` Docker volume when `STORAGE_DRIVER=local`.

Markdown export:

- Use `/admin/export` to export all content as a portable Markdown archive.
- Keep exports outside the server as a portable content archive.
- Use the same `/admin/export` screen to import a Starry Summer Markdown archive back into the platform. Imported content is restored as drafts first, while public/private visibility from the archive is preserved.

## 5. Restore

Restore PostgreSQL from a dump:

```bash
docker compose exec -T postgres psql -U "$POSTGRES_USER" "$POSTGRES_DB" < backups/starry-summer-YYYY-MM-DD.sql
```

Restore assets:

- Restore the MinIO volume or copy objects back to the configured bucket.
- Confirm uploaded images load from public pages.

Restore from Markdown when you do not want to restore the whole database:

- Log in to `/admin/export`.
- Paste the full archive exported by `Export all`.
- Use `Import archive` to recreate every content item as a draft, then review and publish from `/admin/content`.

## 6. Updates

Pull the latest code, rebuild, and restart:

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
