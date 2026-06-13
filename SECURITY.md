# Security Policy

Starry Summer is a personal publishing system, so security reports should focus
on issues that could expose private content, admin sessions, reader identity,
deployment secrets, uploaded assets, or production data.

## Reporting

Please do not open a public issue with exploit details or real credentials.
If this repository is hosted under your own account, use GitHub private
vulnerability reporting when available. Otherwise, contact the maintainer
through a private channel first and include:

- affected version or commit
- affected route, script, or deployment path
- reproduction steps with dummy data only
- impact and suggested mitigation, if known

## Supported Versions

The main branch is the supported development line until Starry Summer publishes
tagged releases.

## Notes

Do not include real admin accounts, password hashes, OAuth secrets, API keys,
private owner names, production database exports, uploads, or screenshots with
private data in issues, pull requests, tests, migrations, or documentation.

Current dependency security notes are tracked in `docs/security.md`.
