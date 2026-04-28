# Contributing to BlessCupid

Thank you for helping build BlessCupid. This document covers the local
development loop, the pre-commit hooks we expect every contributor to run, and
the rules that come from `AGENTS.md` (governance) and
`docs/copy/PLACEHOLDERS.md` (Pastor copy contract).

## Repo layout

This is a pnpm + Turbo monorepo.

```
apps/api          NestJS API + Prisma (PostgreSQL)
apps/mobile       Expo / React Native client
packages/shared   Zod schemas, COVENANT_VERSION, shared types
services/*        Out-of-band workers (matching, moderation, safety)
docs/             ADRs, copy contracts, design notes
```

`pnpm-workspace.yaml` includes `apps/*`, `packages/*`, and `services/*`.

## Prerequisites

- Node `>=20.11.0` (see `.nvmrc`)
- pnpm `>=9` (we pin `pnpm@9.12.0` in `package.json` `packageManager`)
- A local PostgreSQL for `apps/api` (see `apps/api/.env.example`)

## First-time setup

```bash
pnpm install
pnpm --filter @blesscupid/api exec prisma generate
```

`prisma generate` is required before `pnpm -r typecheck` will pass — the API
imports types from the generated Prisma client.

## Daily commands

```bash
pnpm -r typecheck         # type-check every workspace
pnpm -r test              # run vitest in every workspace that has tests
pnpm --filter @blesscupid/api dev
pnpm --filter @blesscupid/mobile start
```

## Pre-commit hooks (required)

Every commit must locally pass `typecheck` and `test` for the workspaces it
touches. CI (`.github/workflows/ci.yml`) re-runs both on every PR, but local
hooks keep PRs green and tight.

### Option A — minimal git hook (no extra dependency)

Drop the following file in `.git/hooks/pre-commit` and make it executable
(`chmod +x .git/hooks/pre-commit`):

```bash
#!/usr/bin/env bash
set -euo pipefail

# Only run if there are staged changes to TS/JS/JSON files.
if git diff --cached --name-only | grep -qE '\.(ts|tsx|js|jsx|json)$'; then
  pnpm -r typecheck
  pnpm -r test
fi
```

### Option B — Husky (if you prefer a managed hook)

If your branch wires Husky, add this script and commit `.husky/pre-commit`:

```bash
#!/usr/bin/env bash
. "$(dirname "$0")/_/husky.sh"
pnpm -r typecheck
pnpm -r test
```

Husky is **not** wired by default to keep `pnpm install` fast for new
contributors. If you add it, gate it behind a `prepare` script that is safe to
run in CI without Husky installed.

## Code review checklist

- `pnpm -r typecheck` clean.
- `pnpm -r test` clean (or new tests added next to the change).
- No edits to user-facing copy under `docs/copy/moderation-pastor.md` or the
  `faith.*`, `bio.*`, `photo.rejection.*`, or `covenant.*` keys without
  Pastor sign-off (`AGENTS.md` and `docs/copy/PLACEHOLDERS.md`).
- No production deploy-config edits in scaffolding PRs (separate ticket).
- New env vars added to the relevant `.env.example`.

## Branch + commit style

- Branch: `feat/BLE-XX-short-name`, `fix/BLE-XX-short-name`.
- Commit subject: `feat(BLE-XX): one-line summary` (Conventional Commits).
- Squash-merge into `main`. PR title becomes the commit subject.

## Reporting bugs / cutting tickets

Use the BLE Linear board. Link the ticket id in the PR description.
