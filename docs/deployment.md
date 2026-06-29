# Deployment Guide

Starry Summer targets a database-free, repository-backed web deployment. The default production path is Vercel for the Next.js app, GitHub repository files for durable content, and optional hosted edge services for interactions or uploaded assets.

## 1. Prerequisites

- Node.js 22 and npm 10 for local verification.
- A GitHub repository connected to Vercel.
- A Vercel project using `apps/web` as the project root directory.
- A GitHub repository workflow where content, settings, and small assets are changed through commits.

## 2. Vercel Project Setup

Import the repository in Vercel and keep the Next.js framework preset.

Recommended project settings:

```text
Root Directory: apps/web
Install Command: cd ../.. && npm ci
Build Command: cd ../.. && npm run build
Output Directory: Framework default
Node.js Version: 22
```

The build command runs from the monorepo root so shared packages compile before `apps/web`.

## 3. Environment Setup

Static deployment does not need an admin account, password hash, session secret, or GitHub contents token. Generate an interaction secret only if an optional interaction Worker needs request signing:

```bash
npm run auth:interaction-secret
```

Set these variables in Vercel:

- `NODE_ENV`: `production`.
- `PUBLIC_SITE_URL`: your final public site URL, for example `https://blog.your-domain.com`.
- `INTERACTION_HASH_SECRET`: optional; generated with `npm run auth:interaction-secret` when an interaction Worker is configured.
- `RELEASE_VERSION` and `GIT_REVISION`: optional release metadata returned by `/health`.

Check an env file locally before copying values to Vercel:

```bash
npm run ops:doctor -- .env.production
```

## 4. Repository Publishing

Starry Summer now uses static, git-driven publishing:

1. Edit content, settings, or image files in the repository.
2. Commit and push the change.
3. Vercel rebuilds the public site from the repository files.

The admin UI remains useful for reading repository content and local draft/preview work, but it does not perform online saves or GitHub commits.

## 5. Verify Production

After DNS and Vercel deployment are ready:

```bash
npm run ops:smoke -- https://blog.your-domain.com
```

Verify manually:

- `https://blog.your-domain.com` opens the public site.
- `https://blog.your-domain.com/health` returns the web health response.
- `https://blog.your-domain.com/admin/content` opens the static admin workspace without a login redirect.
- Pushing a small content change triggers a Vercel deployment.

## 6. Backup

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

## 7. Restore

Restore from a static backup:

```bash
RESTORE_CONFIRM=YES npm run ops:restore -- backups/starry-summer-static-YYYY-MM-DD
```

The restore script verifies archives and checksums before replacing `apps/web/content` and `apps/web/public/images`.

## 8. Optional Dynamic Services

Keep the core site simple. Add hosted services only when the feature needs mutable runtime data:

- Likes and views: Cloudflare Workers + KV or D1.
- Comments and guestbook moderation: Cloudflare Workers + D1, or a GitHub Discussions-based system.
- Uploaded authoring assets: GitHub repository files under `apps/web/public/images/uploads`.

When these services are not configured, the repository-backed public site and admin publishing flow remain usable.
