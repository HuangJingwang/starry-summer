# Deployment Guide

Starry Summer now targets a database-free web deployment. The default Docker Compose stack runs only the Next.js web app and Caddy. Public content and settings are read from repository files, while admin publishing writes back through repository commits.

## 1. Server Prerequisites

- A Linux cloud server with Docker and Docker Compose.
- A domain pointing to the server public IP.
- Ports `80` and `443` open.
- Node.js 22 and npm 10 for local verification.

## 2. Environment Setup

Generate `.env` with a local admin password:

```bash
npm run ops:init-env -- "your local admin password"
```

For production, copy `.env.example` to `.env` and change these values:

- `DOMAIN`: your public domain, for example `blog.your-domain.com`.
- `PUBLIC_SITE_URL`: `https://blog.your-domain.com`.
- `ACME_EMAIL`: email used by Caddy for HTTPS certificates.
- `ADMIN_EMAIL`: owner login account.
- `ADMIN_PASSWORD_HASH`: generated with `npm run auth:hash-password -- "your strong password"`.
- `SESSION_SECRET`: generated with `npm run auth:secret`.
- `INTERACTION_HASH_SECRET`: generated with `npm run auth:interaction-secret`.
- `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GITHUB_CALLBACK_URL`: GitHub OAuth App values for reader login.
- `RELEASE_VERSION` and `GIT_REVISION`: optional release metadata returned by `/health`.

Check the environment before boot:

```bash
npm run ops:doctor
```

## 3. First Boot

Build and start the web stack:

```bash
npm run ops:docker-preflight
docker compose build
docker compose up -d
```

Check service status:

```bash
docker compose ps
docker compose logs -f web caddy
```

Verify:

- `https://$DOMAIN` opens the public site.
- `https://$DOMAIN/health` returns the web health response.
- `https://$DOMAIN/admin/login` opens the admin login screen.

Run the public smoke check after DNS and HTTPS are ready:

```bash
npm run ops:smoke -- https://blog.your-domain.com
```

## 4. Repository Publishing

Admin content and settings publishing use Next-owned repository routes:

- `/api/repository/content`
- `/api/repository/settings`

Configure the GitHub repository publishing environment used by `apps/web/src/lib/github-content-commit.ts` before relying on production admin publishing. The public site continues to render existing repository files when publishing is not configured.

## 5. Backup

Create a timestamped static backup:

```bash
npm run ops:backup
```

The backup contains:

- `web-content.tar.gz`: `apps/web/content`.
- `public-images.tar.gz`: `apps/web/public/images`.
- `manifest.txt`: timestamp, SHA-256 checksums, and git revision.

You can pass a fixed output directory:

```bash
npm run ops:backup -- backups/starry-summer-before-upgrade
```

## 6. Restore

Restore from a static backup:

```bash
RESTORE_CONFIRM=YES npm run ops:restore -- backups/starry-summer-static-YYYY-MM-DD
```

The restore script verifies archives and checksums before replacing `apps/web/content` and `apps/web/public/images`.

## 7. Updates

Pull the latest code, rebuild, restart, and run smoke checks in one step:

```bash
git pull
npm run ops:deploy -- https://blog.your-domain.com
```

The deploy script runs `ops:doctor`, validates Compose, exports release metadata for `/health`, builds images, starts the web stack, and then runs `ops:smoke`.

By default, deploy refuses to run with uncommitted local changes. For an intentional emergency deploy from a dirty worktree:

```bash
ALLOW_DIRTY_DEPLOY=true npm run ops:deploy -- https://blog.your-domain.com
```

## 8. Production Notes

- Keep `.env` out of git.
- Do not add PostgreSQL, Redis, MinIO, or the old Nest API back to the default Compose path.
- Use Cloudflare Workers, KV/D1, R2, or similar hosted services for interactions, LeetCode sync, and asset uploads when static files are not enough.
- Keep regular off-server backups of repository content and public images.
