# Contributing

Starry Summer is a single-owner personal content platform. Contributions are
welcome when they keep the project quiet, content-first, self-hostable, and
safe for long-term public writing.

## Development Setup

Use Node.js 22 or newer and npm 10 or newer.

```bash
npm install
npm run typecheck
npm test
npm run build
docker compose config --quiet
```

For local Docker preview, generate a private `.env` file instead of editing
`.env.example`:

```bash
npm run ops:init-env -- "your local admin password"
```

## Project Direction

- Public pages should keep the dark cyber archive visual language.
- Admin pages should be fully Chinese, practical, dense, and work-focused.
- Public identity must use `Aster.H`; do not expose the owner's real name.
- Public profile copy should describe a personal content platform, not an AI
  product portfolio.
- Reader interaction should stay intentionally bounded: readable by default,
  authenticated and moderated for comments and guestbook writes.

## Pull Requests

Before opening a pull request:

1. Keep the change focused.
2. Add or update tests for behavior changes and durable regressions.
3. Do not commit `.env`, uploads, backups, local reference imports, or generated
   build output.
4. Run the verification commands listed above.
5. Mention any command you could not run and why.

## Security

Never include real credentials, password hashes, OAuth secrets, deployment
tokens, private owner names, or production data in examples, migrations, tests,
or screenshots. See `docs/security.md` for current security notes.
