# Static Hosting Migration

Starry Summer is moving toward a hosted, database-free public site. The target shape is:

- Next.js public site hosted on Vercel or Cloudflare Pages.
- Git repository files as the long-term content source.
- GitHub API for authoring and publishing changes.
- Cloudflare Workers for small dynamic features such as likes, comments, guestbook, and scheduled sync.
- Cloudflare KV, D1, or R2 only where repository files are not the right storage model.

## Phase 1: Public Content From Repository Files

The public reader site should not need PostgreSQL to render posts, notes, moments, projects, taxonomy pages, RSS, or sitemap.

Current first step:

- `apps/web/content/public-content.json` stores public content records in a Git-friendly format.
- `apps/web/content/site-settings.json` stores public profile, hero copy, social links, and navigation.
- `apps/web/src/lib/public-content.ts` reads this file by default.
- `apps/web/src/lib/settings-repository.ts` reads site settings from repository files by default.
- The public runtime no longer honors `PUBLIC_CONTENT_SOURCE=api` or `PUBLIC_SETTINGS_SOURCE=api`; repository files are the public source of truth.
- Legacy API helper functions can remain during migration for tests or one-off exports, but public pages should not switch back to the database backend through environment variables.

Recommended next refinements:

- Split `public-content.json` into per-entry Markdown files with front matter once the editing workflow is ready.
- Keep generated indexes small and deterministic, for example `apps/web/content/index.json`.
- Let the admin settings form write `apps/web/content/site-settings.json` through the same GitHub commit route used for content.
- Treat repository content as the source of truth, not database export as the source of truth.

## Phase 2: Authoring Through GitHub

The admin publishing flow should eventually write repository files instead of database rows.

Publishing flow:

1. Admin edits an article, note, moment, project, or page.
2. The web app calls a protected publishing action.
3. The publishing action writes Markdown, metadata JSON, and asset references through the GitHub API.
4. GitHub receives a commit.
5. Vercel or Cloudflare rebuilds the public site.

This keeps content portable and versioned. A failed database, server, or vendor account should not trap the writing.

Current implementation notes:

- Admin content now runs in repository mode only; the content list, editor, taxonomy view, and dashboard no longer switch back to the legacy database API with `NEXT_PUBLIC_CONTENT_WRITE_TARGET`.
- The endpoint is `POST /api/repository/content`.
- The web app no longer proxies every `/api/*` request to the old backend API through `next.config.ts`; web-owned routes such as `/api/auth/*` and `/api/repository/*` are handled by Next.js directly.
- The web `/health` route reports the web deployment itself and no longer depends on the legacy API or PostgreSQL health state.
- The admin taxonomy page derives categories, tags, and series from repository content metadata instead of calling the old taxonomy database endpoints.
- The admin home, content list, and content edit pages read repository content files instead of `/api/admin/content`.
- Admin content bulk actions and permanent delete no longer call the old database API. Single-entry saves, publish, archive, and restore actions go through the repository publishing flow.
- The admin Markdown import/export screen no longer calls the old `/api/admin/content/import` or `/api/admin/content/export` database endpoints; migration should happen through Git files, the repository editor flow, or a future GitHub import script.
- Admin login is now available inside the web app through `POST /api/auth/login`, `GET /api/auth/me`, and `POST /api/auth/logout`; these routes use the existing `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`, and `SESSION_SECRET` environment variables.
- Repository publishing accepts either a valid `ss_session` admin cookie or `x-repository-publish-secret` for machine-to-machine calls.
- Server-side GitHub publishing requires:
  - `GITHUB_CONTENT_OWNER`
  - `GITHUB_CONTENT_REPO`
  - `GITHUB_CONTENT_BRANCH`
  - `GITHUB_CONTENT_TOKEN`
  - `REPOSITORY_PUBLISH_SECRET`
- The route commits the generated Markdown file and updates `apps/web/content/public-content.json`.
- Production should not expose repository publishing until the admin authentication replacement is finished. The current route requires `REPOSITORY_PUBLISH_SECRET` so it cannot be used as an unauthenticated public write endpoint.

## Phase 3: Interactions Without PostgreSQL

Public content is a good fit for Git. Interaction state is not always a good fit for Git because it changes frequently.

Recommended storage:

- Likes and views: Cloudflare Workers + KV or D1.
- Guestbook and comments: Cloudflare Workers + D1, or GitHub Issues/Giscus if moderation can live outside this app.
- Assets: repository files for curated images and small authoring uploads.
- Reader login: GitHub OAuth handled by Worker or a serverless route.

Current implementation notes:

- Set `NEXT_PUBLIC_INTERACTION_BASE_URL` to route browser-side likes, views, comment submissions, guestbook submissions, and admin moderation actions to the interaction Worker.
- Set `INTERACTION_BASE_URL` for server-rendered approved comment and guestbook reads.
- When these variables are not configured, the web app treats interactions as unavailable and does not fall back to the old `/api/...` database backend.
- The expected Worker-compatible paths are:
  - `POST /likes/:targetType/:targetId`
  - `POST /views/:targetType/:targetId`
  - `GET /comments/:targetType/:targetId`
  - `POST /comments`
  - `GET /guestbook`
  - `POST /guestbook`
  - `GET /admin/comments?status=pending`
  - `GET /admin/guestbook?status=pending`
  - `PATCH /admin/comments/:id/moderate`
  - `PATCH /admin/guestbook/:id/moderate`
  - `DELETE /admin/comments/:id`
  - `DELETE /admin/guestbook/:id`

## Assets Without The API Database

Assets now live in Git with a repository manifest. This keeps the personal archive portable and lets Vercel publish uploaded files after the GitHub commit rebuilds the site.

Current implementation notes:

- `apps/web/content/assets.json` stores versioned public assets that ship with the site, such as avatars, default covers, and curated backgrounds.
- `apps/web/src/lib/assets-repository.ts` reads that manifest without calling the API backend.
- `POST /api/repository/assets` commits uploaded files into `apps/web/public/images/uploads/YYYY/MM` and updates `apps/web/content/assets.json`.
- `GET /api/repository/assets?usage=cover` reads the repository asset index for the admin gallery and cover picker.
- `DELETE /api/repository/assets/:id` removes the asset from `assets.json`; historical files remain in Git history.
- GitHub storage is intended for small blog images and attachments. Large galleries, videos, or frequent binary churn should be reconsidered before they bloat the repository.

Suggested D1 tables:

```sql
create table interaction_counters (
  target_type text not null,
  target_id text not null,
  kind text not null check (kind in ('like', 'view')),
  count integer not null default 0,
  updated_at text not null,
  primary key (target_type, target_id, kind)
);

create table public_submissions (
  id text primary key,
  resource text not null check (resource in ('comments', 'guestbook')),
  target_type text,
  target_id text,
  author_name text not null,
  body text not null,
  status text not null default 'pending',
  anchor_json text,
  ip_hash text,
  user_agent text,
  created_at text not null,
  updated_at text not null
);

create index public_submissions_lookup_idx
  on public_submissions (resource, status, target_type, target_id, created_at);
```

## LeetCode Sync

The hosted plan can support LeetCode sync without PostgreSQL.

The practical architecture is near-real-time, not true push realtime:

1. A Cloudflare Worker Cron job runs every few minutes.
2. It fetches recent LeetCode submissions for the configured username.
3. It normalizes the submissions into a stable JSON shape.
4. It writes `apps/web/content/leetcode/submissions.json` or `apps/web/content/leetcode/dashboard.json` through the GitHub API, or stores hot data in a Worker-owned KV/D1 cache.
5. The site rebuilds from repository JSON or reads the Worker-generated JSON with short cache revalidation.

This works well for a personal public archive because LeetCode does not act like a first-party webhook source for this site. If second-level realtime is required later, use one of these add-ons:

- A small browser extension that sends accepted submissions to a Worker after submission.
- A manual "sync now" button in admin that calls the same Worker.
- A queue-backed Worker that stores the latest submissions in D1 and periodically commits snapshots to Git.

Suggested data files:

```text
apps/web/content/leetcode/
  submissions.json
  dashboard.json
  notes/
    two-sum.md
```

The public `/leetcode` page should read these files first. API-backed study sync can remain as a temporary compatibility path until the database backend is removed.

Current implementation notes:

- Public `/leetcode` reads `apps/web/content/leetcode/dashboard.json` and does not fall back to the old API/database backend through `API_BASE_URL`.
- Admin `/admin/study` now reads the same repository dashboard file on the server and mounts the study manager in repository mode.
- In repository mode, study settings, problem note saves, report draft generation, and LeetCode sync buttons are disabled so they do not call the old `/api/admin/study*` database endpoints.
- The next step is replacing those disabled actions with a Worker or GitHub API flow that updates `dashboard.json`, `submissions.json`, and optional note files.

## Removal Criteria For The Current Backend Database

The PostgreSQL backend is no longer required when all of these are true:

- Public content pages render from repository files.
- RSS, sitemap, search, taxonomy, and archives render from repository files.
- Admin publish creates Git commits instead of database records.
- Likes, views, comments, and guestbook no longer use PostgreSQL tables.
- LeetCode dashboard reads from repository files, KV, or D1.
- Asset upload no longer depends on API local volume storage.
- Deployment docs and smoke tests no longer expect PostgreSQL or Redis.

Those conditions are now the default target for the web deployment. Keep any remaining API code as historical migration reference only; do not wire new runtime paths to PostgreSQL.

## Hosted Web Deployment

The default deployment path is Vercel hosting the database-free Next.js web surface. The Nest API, PostgreSQL, Redis, MinIO, migration container, and reverse proxy stack are no longer part of the default production path.

Next-owned routes such as `/api/auth/*` and `/api/repository/*` are handled by the web deployment. Repository publishing creates GitHub commits, and the connected Vercel project rebuilds from those commits.
