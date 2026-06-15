# Starry Summer Interaction Worker

This is the target replacement for the old PostgreSQL-backed interaction API.

The public web app can point to this Worker with:

```text
NEXT_PUBLIC_INTERACTION_BASE_URL=https://your-worker.example
INTERACTION_BASE_URL=https://your-worker.example
```

Bind a D1 database as `DB` and create the tables documented in `docs/static-hosting-migration.md`.

This first scaffold intentionally keeps identity simple. Before production use, add the final reader/admin authentication layer and CORS origin allowlist.
