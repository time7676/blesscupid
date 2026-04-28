# BlessCupid

Faith-first dating app for Christians and Catholics. Mobile-first (iOS + Android), holy-by-design.

> **Holy guardrails are not a feature — they're the spec.** Every text message and uploaded image passes through a moderation pipeline before delivery; borderline content goes to a human-reviewable queue. Profile photos require face-detection. Age gate is enforced server-side at signup. UX copy that touches faith, relationships, or moderation is owned by the Pastor, not engineering.

## Stack

- **Mobile** — React Native + Expo (managed), React Navigation, Expo Secure Store, Zustand
- **API** — NestJS + Prisma (Postgres) + Argon2id + JWT/refresh + Apple/Google OAuth
- **Shared** — TS + Zod (`packages/shared`)
- **Matching engine** — pure TS (`services/matching`)
- **Moderation** — OpenAI (text), AWS Rekognition (images, including face-detection)
- **Hosting** — Fly.io (API), EAS (mobile)
- **Observability** — Sentry, PostHog, GitHub Actions CI

See [docs/adr/0001-tech-stack.md](docs/adr/0001-tech-stack.md) for the full decision record.

## Layout

```
apps/
  api/              NestJS backend (auth, onboarding, moderation, photos)
  mobile/           Expo React Native app
packages/
  shared/           Zod schemas, TS types, age-gate, moderation rules
services/
  matching/         Faith-aligned matching engine v1
docs/
  adr/              Architecture decision records
.github/workflows/  CI
```

## Prerequisites

- Node 20.11+ (`.nvmrc`)
- pnpm 9.12+ (`corepack enable && corepack prepare pnpm@9.12.0 --activate`)
- Postgres 15+ (local or Supabase/Neon URL)
- Xcode 15+ (iOS Simulator) and/or Android Studio (Emulator) for mobile dev
- Expo Go on your phone if you want to test on a physical device
- Optional: Fly CLI (`flyctl`), EAS CLI (`npm i -g eas-cli`), AWS + OpenAI API keys for moderation

## One-command setup

```bash
pnpm install
```

That installs all workspace deps via pnpm workspaces. Then configure environment files:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/mobile/.env.example apps/mobile/.env
```

Fill in:

- `apps/api/.env` — `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` (32+ random bytes each). For local dev, the Postgres URL in `.env.example` works against `docker run -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:15`.
- `apps/mobile/.env` — `EXPO_PUBLIC_API_BASE_URL` should be your dev machine's LAN IP for device testing (e.g. `http://192.168.1.20:3000`), or `http://localhost:3000` for simulators only.

Run database migrations:

```bash
pnpm --filter @blesscupid/api exec prisma generate
pnpm --filter @blesscupid/api exec prisma migrate dev
```

## Run the demo (signup → login → profile)

In one terminal:

```bash
pnpm --filter @blesscupid/api run dev
```

In another:

```bash
pnpm --filter @blesscupid/mobile run start
# press i for iOS simulator, a for Android emulator, or scan QR with Expo Go
```

Demo flow:

1. App opens on the **Signup** screen.
2. Enter email + password (10+ chars) + DOB (YYYY-MM-DD), tick the Holy Code of Conduct, **Create account**. The api hashes the password with Argon2id and issues access + refresh tokens.
3. Or tap *Sign in* if the account already exists. The api returns tokens; the app stores them in Expo Secure Store and routes to **Profile**.
4. **Profile** is the v0 blank screen. Tap *Sign out* to clear tokens and return to Signup.

## Common scripts

| Command | Effect |
| --- | --- |
| `pnpm install` | install all workspace deps |
| `pnpm --filter @blesscupid/api run dev` | NestJS in watch mode |
| `pnpm --filter @blesscupid/mobile run start` | Expo dev server |
| `pnpm --filter @blesscupid/api run test` | api unit tests (vitest) |
| `pnpm --filter @blesscupid/shared run test` | shared schema tests |
| `pnpm --filter @blesscupid/matching run test` | matching engine tests |
| `pnpm -r run typecheck` | typecheck every workspace package |

## CI

`.github/workflows/ci.yml` runs typecheck + tests on every push and pull request. Jobs: `shared`, `api`, `matching`, `mobile`. The first PR is expected to be green.

## Deploy

- **API** — `flyctl deploy` from `apps/api` (the Dockerfile + `fly.toml` are checked in). Set Fly secrets for `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `OPENAI_API_KEY`, `AWS_*`, `SENTRY_DSN`. Production deploy details and prod Docker hardening are tracked as a follow-up issue.
- **Mobile** — `eas build` and `eas submit`. Channel mapping is in `apps/mobile/eas.json`.

## Holy guardrails — non-negotiable

- **No "hookup" framing.** Anywhere. Default tone is intentional, marriage-minded.
- **18+ only.** Age gate enforced server-side at signup (`checkAgeGate`).
- **Every chat message** passes through `TextModerationService` before persistence.
- **Every photo upload** passes through `PhotoModerationService` (faces required for primary photos).
- **Reports + blocks** are first-class endpoints, not feature flags.
- **Pastor owns the copy** that touches faith, relationships, or moderation. Engineering must not author it. Strings tagged `// PASTOR_COPY_REQUIRED` and `i18n/en.placeholder.json` are awaiting Pastor sign-off.

If you spot any feature, copy, or pull request that violates these, stop and escalate.
