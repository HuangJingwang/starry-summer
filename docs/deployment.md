# Deployment Guide

Starry Summer targets a database-free, repository-backed web deployment. The default production path is Vercel for the Next.js app, GitHub repository files for durable content, and optional hosted edge services for interactions or uploaded assets.

## 1. Prerequisites

- Node.js 22 and npm 10 for local verification.
- A GitHub repository connected to Vercel.
- A Vercel project using `apps/web` as the project root directory.
- A GitHub token with repository contents write access for admin publishing.

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

Generate local secrets before filling production values:

```bash
npm run auth:hash-password -- "your strong password"
npm run auth:secret
npm run auth:interaction-secret
```

Set these variables in Vercel:

- `NODE_ENV`: `production`.
- `PUBLIC_SITE_URL`: your final public site URL, for example `https://blog.your-domain.com`.
- `ADMIN_EMAIL`: owner login account.
- `ADMIN_PASSWORD_HASH`: generated with `npm run auth:hash-password`.
- `SESSION_SECRET`: generated with `npm run auth:secret`.
- `INTERACTION_HASH_SECRET`: generated with `npm run auth:interaction-secret`.
- `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GITHUB_CALLBACK_URL`: GitHub OAuth App values for reader login.
- `GITHUB_CONTENT_OWNER`: GitHub owner or organization that owns the content repository.
- `GITHUB_CONTENT_REPO`: repository name, usually `starry-summer`.
- `GITHUB_CONTENT_BRANCH`: publishing branch, usually `main`.
- `GITHUB_CONTENT_TOKEN`: GitHub fine-grained token with contents write access for the repository.
- `REPOSITORY_PUBLISH_SECRET`: long random secret for machine-to-machine repository publishing.
- `RELEASE_VERSION` and `GIT_REVISION`: optional release metadata returned by `/health`.

Check an env file locally before copying values to Vercel:

```bash
npm run ops:doctor -- .env.production
```

## 4. Repository Publishing

Admin content and settings publishing use Next-owned routes:

- `/api/repository/content`
- `/api/repository/settings`

Publishing flow:

1. The admin UI sends a protected request to the repository route.
2. The route uses `GITHUB_CONTENT_TOKEN` to write content and settings files through the GitHub API.
3. GitHub receives a commit on `GITHUB_CONTENT_BRANCH`.
4. Vercel automatically rebuilds and publishes the site.

If repository publishing variables are missing, the public site still renders existing repository files, but admin publishing returns a configuration error.

## 5. Verify Production

After DNS and Vercel deployment are ready:

```bash
npm run ops:smoke -- https://blog.your-domain.com
```

Verify manually:

- `https://blog.your-domain.com` opens the public site.
- `https://blog.your-domain.com/health` returns the web health response.
- `https://blog.your-domain.com/admin/login` opens the admin login screen.
- Publishing a small draft creates a GitHub commit and triggers a Vercel deployment.

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
