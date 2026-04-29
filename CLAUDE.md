# CLAUDE.md — BlessCupid Monorepo

This is the canonical BlessCupid monorepo per [BLE-160](/BLE/issues/BLE-160). Do not work in any other scaffold.

## Layout

```
apps/api              NestJS + Prisma (Postgres), Argon2id, JWT/refresh, Apple/Google OAuth
apps/mobile           Expo React Native, BLE-92 design system v0
packages/shared       Zod schemas, age gate, moderation rules
services/matching     faith-aligned matching engine
services/moderation   OpenAI text + AWS Rekognition images (face-detect required)
services/safety       reports, blocks, hard-delete, account deletion
docs/adr              tech decision records (ADR-0001 = stack)
docs/design           BLE-91/92 design system + Cathedral Light direction
docs/deploy           deploy + observability runbooks
docs/copy             pastor-reviewed UX copy (placeholders live here until Pastor signs off)
```

## Hot commands

```bash
pnpm install                          # workspace bootstrap
pnpm -F @blesscupid/api dev           # api dev server
pnpm -F @blesscupid/mobile start      # expo dev server
pnpm test                             # all package tests (turbo)
pnpm typecheck                        # all package typechecks
pnpm lint                             # all package lints
```

Filter aliases: `pnpm api <script>`, `pnpm mobile <script>`, `pnpm shared <script>`.

## Holy guardrails

BlessCupid is a HOLY-by-design product. Every shipped feature must respect the Pastor's Holy Code of Conduct:

- No sexual content, nude imagery, or hookup framing in copy or UX
- Every chat thread has a visible report button + one-tap block
- Profile photos require face-detection pass; body-only photos rejected by default
- Age gate 18+ on signup
- Text moderation via OpenAI; image moderation via AWS Rekognition (see ADR-0001)

Any UX copy touching faith, relationships, or moderation must be reviewed by the Pastor before shipping. Source copy under `docs/copy/` — `PLACEHOLDERS.md` lists strings awaiting Pastor sign-off. Do not author this copy yourself; request it.

## Stale scaffold

The legacy single-app Expo scaffold lives in workspace `c8eafa69-7542-40b4-a4e8-7745094aa4d8` and is `STALE.md`-marked per [BLE-160](/BLE/issues/BLE-160). Do not commit there. Only revisit to extract preserved unique work (BLE-96 liturgical, BLE-98 verse cache, BLE-102 verse-of-day) for porting into this monorepo.

If a heartbeat lands you in that workspace, switch to this monorepo workspace before branching new work.

## More

- Agent instructions: see `AGENTS.md` files in agent instruction dirs (loaded by the harness, not committed here)
- Contributor guide: `CONTRIBUTING.md`
- Human-facing overview: `README.md`
