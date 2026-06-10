# Personal Content Platform Design

Date: 2026-06-10

## 1. Goal

Build a personal content platform that starts as a high-quality single-owner blog and can grow into a larger personal publishing system. The site should support public reading, private authoring, reader interaction, Markdown-based long-term content ownership, and cloud-server deployment.

The product direction follows the spirit of zhouyi.run: a personal home, writing archive, project showcase, search surface, and visible site activity. It should feel like a personal operating base rather than a plain article list.

## 2. Users

### Site Owner

The owner is the only admin user in V1. They need to write, preview, publish, organize, import, export, and moderate content from a secure admin area.

### Public Reader

Readers can browse published content, search, read on mobile or desktop, like content, leave comments where enabled, and post guestbook messages.

## 3. V1 Scope

V1 must deliver a complete public site, secure single-admin backend, content creation workflow, reader interaction, and Docker-based deployment path.

Included in V1:

- Public home page, article archive, notes, moments, projects, guestbook, about page, search, RSS, sitemap.
- Single-admin login and protected admin area.
- Markdown editor with preview.
- Content lifecycle: draft, published, private, archived.
- Tags, categories, and series for organizing content.
- Image and attachment upload.
- Comments, likes, view counts, and guestbook messages.
- Moderation tools for comments and guestbook entries.
- Markdown import and export for long-term ownership.
- PostgreSQL persistence, Redis support, object storage abstraction.
- Docker Compose deployment for a cloud server.

Excluded from V1:

- Multi-user authoring and roles.
- Email newsletter and subscriptions.
- Payment, membership, or gated content.
- Dedicated mobile app.
- Theme marketplace.
- External full-text search engine.
- Analytics dashboard beyond basic content and interaction counters.

## 4. Information Architecture

Public routes:

- `/`: personal home with identity, latest writing, featured projects, recent moments, search entry, and site stats.
- `/posts`: long-form articles.
- `/posts/:slug`: article detail.
- `/notes`: shorter notes and fragments.
- `/notes/:slug`: note detail.
- `/moments`: daily timeline with text and optional images.
- `/projects`: project and work showcase.
- `/projects/:slug`: project detail.
- `/guestbook`: public message board.
- `/about`: personal profile, social links, contact links, and site introduction.
- `/search`: unified search over published content.
- `/rss.xml`: RSS feed.
- `/sitemap.xml`: sitemap for search engines.

Admin routes:

- `/admin/login`: admin login.
- `/admin`: overview dashboard.
- `/admin/content`: unified content list.
- `/admin/content/new`: create content.
- `/admin/content/:id`: edit content.
- `/admin/taxonomy`: categories, tags, and series.
- `/admin/assets`: uploaded files and images.
- `/admin/comments`: comment moderation.
- `/admin/guestbook`: guestbook moderation.
- `/admin/projects`: project management.
- `/admin/settings`: site profile, navigation, SEO, storage, and security settings.
- `/admin/export`: Markdown export and import tools.

## 5. Content Model

### Content

A shared content model supports posts, notes, moments, pages, and projects where practical.

Fields:

- `id`
- `type`: `post`, `note`, `moment`, `page`, `project`
- `title`
- `slug`
- `summary`
- `bodyMarkdown`
- `bodyHtml`
- `status`: `draft`, `published`, `private`, `archived`
- `visibility`: `public`, `private`
- `coverAssetId`
- `publishedAt`
- `updatedAt`
- `createdAt`
- `seoTitle`
- `seoDescription`
- `allowComments`
- `pinned`
- `featured`
- `viewCount`
- `likeCount`

### Taxonomy

Categories are hierarchical enough for content grouping, while tags remain flat and flexible.

Entities:

- `Category`: name, slug, description, sort order.
- `Tag`: name, slug, description.
- `Series`: name, slug, description, cover, sort order.

### Project

Projects can be represented as `content.type = project` plus project-specific fields.

Project fields:

- status: `active`, `paused`, `completed`, `archived`
- links: website, repository, demo, article
- stack: list of technologies
- start date and optional end date

### Interaction

Comments:

- Attached to posts, notes, or projects.
- Status: `pending`, `approved`, `rejected`, `spam`.
- Public display only after approval unless the owner changes the setting.
- Each content item can disable comments.

Guestbook entries:

- Independent from content.
- Same moderation states as comments.

Likes:

- Anonymous likes with rate limiting.
- Store enough metadata to prevent easy repeated abuse without building user accounts.

Views:

- Increment via Redis buffer and periodically persist to PostgreSQL.
- Avoid counting obvious repeated refreshes too aggressively.

## 6. Authoring Workflow

Primary workflow:

1. Owner logs into `/admin`.
2. Owner creates or edits content in a Markdown editor.
3. Editor shows live preview using the same Markdown rendering pipeline as public pages.
4. Owner saves as draft, publishes, marks private, or archives.
5. Public pages render only published public content.

Markdown ownership workflow:

- Export published and draft content to Markdown files with front matter.
- Import Markdown files with front matter into the database.
- Preserve slugs, timestamps, tags, categories, series, and status where provided.
- Treat the database as the runtime source of truth in V1, while Markdown export provides portability and backup.

## 7. Frontend Design Principles

The visual direction should be calm, personal, readable, and information-rich. It should avoid looking like a generic SaaS landing page.

Public site:

- First viewport makes the owner identity clear.
- Home page includes recent content and projects without hiding the site behind marketing copy.
- Typography prioritizes long-form reading.
- Dark mode is supported.
- Mobile layout is first-class.
- Search is easy to find.
- Article pages show title, summary, date, update time, tags, category, reading time, views, likes, and table of contents.
- Code blocks support syntax highlighting and copy action.

Admin:

- Dense but understandable operational UI.
- Fast content list filtering by type, status, tag, category, and search text.
- Editor layout supports writing without distraction.
- Moderation views make approve, reject, delete, and mark-spam actions quick.

## 8. Technical Architecture

Use a modular full-stack architecture that can grow without starting as microservices.

Components:

- Web app: Next.js for public pages and admin UI.
- API app: NestJS for authentication, content, interaction, uploads, settings, search, and admin APIs.
- Database: PostgreSQL.
- Cache and jobs: Redis.
- Object storage: local disk in development, MinIO or S3-compatible storage in production.
- Reverse proxy: Caddy or Nginx for HTTPS and routing.
- Deployment: Docker Compose on a cloud server.

Recommended repository layout:

```text
apps/
  web/
  api/
packages/
  config/
  database/
  markdown/
  shared/
infra/
  docker/
  deploy/
docs/
```

The monorepo keeps the system easy to develop while allowing the web and API apps to have clear boundaries.

## 9. API Boundaries

Public APIs:

- Read published content.
- Search published content.
- Create comments and guestbook entries.
- Like content.
- Increment or record views.

Admin APIs:

- Login, logout, session inspection.
- Create, update, delete, publish, archive content.
- Manage taxonomy.
- Upload and manage assets.
- Moderate comments and guestbook entries.
- Import and export Markdown.
- Update site settings.

Internal concerns:

- Markdown parsing and sanitization should live in a shared package.
- API responses should never expose private drafts to public routes.
- Admin-only operations must require authenticated sessions.

## 10. Security

Authentication:

- Single admin account in V1.
- Store password with a strong password hashing algorithm.
- Use secure, HTTP-only cookies for sessions.
- Expire sessions after inactivity.

Public interaction protection:

- Rate-limit comments, guestbook submissions, likes, and view increments.
- Optional CAPTCHA or challenge hook for suspicious traffic.
- Sanitize Markdown and user-submitted text.
- Moderate comments and guestbook entries before display by default.
- Store IP addresses as hashes or retain only short-lived raw values where needed for abuse prevention.

Upload protection:

- Restrict file size.
- Restrict file types.
- Generate safe object keys.
- Do not execute uploaded files.

Deployment protection:

- Force HTTPS in production.
- Keep admin APIs behind authentication.
- Use environment variables for secrets.
- Do not commit production secrets.
- Add database backup instructions and restore procedure.

## 11. Data and Backup

Primary data lives in PostgreSQL. Uploaded files live in object storage. Redis data is treated as disposable except for buffered counters, which must be flushed to PostgreSQL regularly.

Backup strategy:

- PostgreSQL daily dump.
- Object storage backup or provider lifecycle policy.
- Markdown export for content portability.
- Document restore steps for database and assets.

## 12. Deployment

Target deployment is a cloud server.

Production services:

- `web`
- `api`
- `postgres`
- `redis`
- `minio` or external object storage
- `reverse-proxy`

Deployment requirements:

- Docker Compose starts all required services.
- `.env.example` documents required variables.
- Reverse proxy terminates HTTPS.
- Health checks exist for web and API.
- Logs are accessible through Docker.
- Persistent volumes are defined for PostgreSQL, Redis where needed, and MinIO when self-hosted.

## 13. Testing and Verification

V1 should include focused tests for the riskiest behavior.

Backend:

- Authentication and session handling.
- Public/private content visibility.
- Content CRUD.
- Markdown import/export.
- Comment moderation.
- Rate limiting behavior where practical.

Frontend:

- Public route rendering.
- Admin login flow.
- Editor save and publish flow.
- Search and content filtering.

End-to-end:

- Owner logs in, creates a draft, publishes it, sees it publicly, receives a comment, approves it.
- Reader likes a post and leaves a guestbook message.

Deployment:

- Docker Compose boots locally.
- Health checks pass.
- Database migrations run.

## 14. V2 Expansion

Possible future directions:

- Multi-author roles and permissions.
- Newsletter and email subscriptions.
- Meilisearch integration.
- Advanced analytics.
- Webmentions or ActivityPub-style federation.
- Content collections and knowledge base mode.
- Public API.
- Theme customization.
- AI-assisted writing tools.
- Asset image processing pipeline.

## 15. Open Decisions

The design intentionally fixes the product direction and architecture but leaves a few implementation choices for the planning phase:

- Caddy versus Nginx as reverse proxy.
- MinIO self-hosted versus cloud provider object storage.
- Exact Markdown editor library.
- Exact ORM and migration tooling.
- Whether the initial admin UI and public UI share a single design system package from day one.

These choices do not change the product scope and can be settled during implementation planning.
