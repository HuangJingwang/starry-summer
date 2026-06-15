# Starry Summer Assets Worker

Database-free asset service for Starry Summer.

This Worker stores uploaded files in Cloudflare R2 and keeps the gallery index in an R2 JSON object instead of PostgreSQL. It is intended to replace the old Nest `admin/assets` and `assets` endpoints during the static hosting migration.

## Routes

- `POST /admin/assets`
- `GET /admin/assets?usage=cover`
- `DELETE /admin/assets/:id`
- `GET /assets?usage=background`
- `GET /assets/random?usage=background`
- `GET /assets/file/:storageKey`

The web app can point to this Worker by setting:

```text
NEXT_PUBLIC_ASSET_BASE_URL=https://your-assets-worker.your-subdomain.workers.dev
ASSET_BASE_URL=https://your-assets-worker.your-subdomain.workers.dev
```

Admin writes require either:

```text
x-asset-admin-secret: <ASSET_ADMIN_SECRET>
```

or:

```text
authorization: Bearer <ASSET_ADMIN_SECRET>
```

If `PUBLIC_BASE_URL` is set, uploaded asset URLs use that base URL. Otherwise the Worker serves files from `/assets/file/:storageKey`.

## Example Wrangler Config

```toml
name = "starry-summer-assets"
main = "src/index.ts"
compatibility_date = "2026-06-14"

[[r2_buckets]]
binding = "ASSETS"
bucket_name = "starry-summer-assets"

[vars]
ALLOWED_ORIGIN = "https://your-site.pages.dev"
PUBLIC_BASE_URL = "https://your-assets-worker.your-subdomain.workers.dev/assets/file"
```

Set the secret separately:

```powershell
wrangler secret put ASSET_ADMIN_SECRET
```
