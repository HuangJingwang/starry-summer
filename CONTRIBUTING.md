# Contributing

Starry Summer is a single-owner personal content platform. Contributions are
welcome when they keep the project content-first, statically deployable, and
safe for long-term public writing.

## Development Setup

Use Node.js 22 or newer and npm 10 or newer.

```bash
npm install
npm run dev
```

Run these checks for broad application changes:

```bash
npm run typecheck
npm test
npm run build
```

The default static site does not require an admin password or Docker. See
`README.md` for current setup and optional integration configuration. Keep any
local credentials in ignored environment files, never in committed examples.

## Project Direction

`AGENTS.md` is the canonical source for product direction, public identity,
both themes, and design defaults. Do not treat historical preferences as a
reason to remove current features or rewrite approved account URLs. Preserve
existing authorization and moderation behavior when changing reader interactions.

## Pull Requests

Before opening a pull request:

1. Keep the change focused.
2. Add or update tests for behavior changes and durable regressions.
3. Do not commit `.env`, uploads, backups, local reference imports, or generated
   build output.
4. Run checks proportional to the change as described in `AGENTS.md`; use the
   commands above for broad application changes.
5. Mention any command you could not run and why.

## Security

Never include real credentials, password hashes, OAuth secrets, deployment
tokens, private owner names, or production data in examples, migrations, tests,
or screenshots. Approved public profile and repository URLs are not secrets;
keep their real destinations separate from display aliases. See `SECURITY.md`
and `docs/security.md` for current security notes.
