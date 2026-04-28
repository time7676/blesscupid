# ADR-0001: BlessCupid tech stack

- Status: Accepted
- Date: 2026-04-28
- Decider: Founding Engineer (sole engineer)
- Issue: BLE-6

## Context

BlessCupid is a faith-first dating app for Christians and Catholics. Mobile-first (iOS + Android from day one), single founding engineer until the team grows. Hard requirements:

- Holy guardrails: every text message and uploaded image passes through a moderation pipeline before delivery; borderline content goes to a human-reviewable queue.
- 18+ age gate at signup.
- Profile photos require face-detection (no body-only photos by default).
- Visible report + one-tap block on every chat thread.
- Conservative interpretation of the Pastor's Holy Code of Conduct ("Covenant") until it is published.
- One-command local setup, CI green on first PR, EAS-buildable mobile, deployable backend.

## Decision

### Mobile — React Native + Expo (managed workflow)

- Single TypeScript codebase across iOS + Android.
- Expo SDK 51+ with the New Architecture.
- Expo Router for file-based navigation.
- EAS Build for iOS + Android builds; EAS Update for OTA JS-only updates.
- TanStack Query for server state, Zustand for local UI state.

**Why over Flutter:** TypeScript shared with backend (one language across the stack), faster hot-reload + OTA updates, larger ecosystem of integrations (Sentry, PostHog, Stream chat/UI primitives), easier hiring later. Flutter's perf advantage is not material for a chat/profile app at v0.

### Backend — Node.js 20 + NestJS + TypeScript

- NestJS provides the structure (modules, DI, guards, pipes) we will need as we add chat, photos, moderation, and reports — even with one engineer today.
- Zod for input validation via a custom `ZodValidate` pipe (`apps/api/src/common/zod.pipe.ts`); schemas live in `packages/shared` and are reused by mobile.
- Argon2id for password hashing.
- Apple + Google OAuth verified server-side (`apps/api/src/auth/oauth/`).

**Why NestJS over Fastify:** the surface area we are building (auth, onboarding, profile, photos, moderation, reports, chat) is naturally module-shaped. NestJS's DI + guard model maps cleanly onto our holy-guardrail boundaries (e.g., `JwtAuthGuard`, future `CovenantSignedGuard`, `AgeGateGuard`). The structure carries weight when the second engineer joins.

### Auth — Self-hosted (JWT access + opaque refresh)

- Email/password (Argon2id) + Apple/Google OAuth.
- Short-lived access tokens (15 min) signed with `JWT_ACCESS_SECRET`; opaque refresh tokens stored hashed in `Session` table; rotation on use.
- `Covenant` signature recorded per user per version before any matchable feature unlocks.
- Age gate (`checkAgeGate` from `@blesscupid/shared`) enforced server-side at signup; client-side check is UX only.

**Why not Clerk / Supabase Auth:** we hold the user record (`User` + `OAuthAccount` + `Session`) directly in our Postgres so RLS-style holy-rule enforcement, suspension, and Covenant versioning are first-class — not stitched across a third-party auth vendor. We can revisit Clerk if the engineering team grows beyond two.

### Data — Postgres + Prisma

- Postgres (managed; Supabase Postgres or Neon — host TBD in deploy issue).
- Prisma ORM (`apps/api/prisma/schema.prisma`) — typesafe, fast iteration, well-known.
- Schema covers: `User`, `OAuthAccount`, `Session`, `CovenantSignature`, `FaithProfile`, `Profile`, `Photo`, `ModerationItem`. Strict separation between auth identity and profile/faith data.
- All PKs are UUIDs.

### Realtime / chat presence — Supabase Realtime (or Socket.IO fallback)

- Decision deferred to the chat issue. Either:
  - Supabase Realtime over the same Postgres (zero extra infra), or
  - Self-hosted Socket.IO + Upstash Redis presence.
- Both options keep the Postgres schema authoritative — no chat data lives outside Postgres.

### Moderation pipeline (non-negotiable, ships at v0)

- **Text:** OpenAI Moderation API (`omni-moderation-latest`) on every outgoing message and every bio. Implemented in `apps/api/src/moderation/text-moderation.service.ts` + `providers/openai-text.provider.ts`.
- **Images:** AWS Rekognition `DetectModerationLabels` + `DetectFaces`. Reject body-only or no-face primary photos. Implemented in `apps/api/src/moderation/photo-moderation.service.ts` + `providers/rekognition-photo.provider.ts`.
- **Decision shape:** `allow | review | block`. Borderline → `review` → `ModerationItem` row → human reviewer UI (separate child issue).
- Hard-block categories: `sexual_minors`, `sexual` (any), `self_harm`, `hate`. Blocked content never reaches the recipient.

### Hosting + ops

- **API:** Fly.io (Singapore region by default to start; multi-region later). Dockerfile + `fly.toml` checked in.
- **Mobile:** EAS Build / Submit. TestFlight + Internal App Sharing from CI on tagged releases.
- **CI:** GitHub Actions. Lint + typecheck + unit tests on every PR; EAS preview build on PR labels; EAS production build on tag.
- **Error tracking:** Sentry (mobile + API).
- **Product analytics:** PostHog. Self-hostable later.
- **Secrets:** Fly secrets for API; EAS secrets for mobile builds; never committed.

### Monorepo

- pnpm workspaces + Turborepo.
- `apps/mobile` — Expo app.
- `apps/api` — NestJS backend.
- `packages/shared` — Zod schemas, TS types, age-gate, moderation rule constants, safety types.
- `services/matching` — pure-TS matching engine; consumed by the api at runtime.

## Holy guardrails as code (v0 scope)

1. Every chat message goes through `TextModerationService` before persistence.
2. Every photo upload goes through `PhotoModerationService` before exposure to other users; faces required on the primary photo.
3. Reports + blocks are first-class endpoints, not feature-flagged (see `packages/shared/src/safety.ts`).
4. UX copy that touches faith, relationships, or moderation is **not written by the engineer** — it is sourced from the Pastor's review. v0 ships with neutral, function-only copy where Pastor copy is missing, and faith-touching strings are tagged `// PASTOR_COPY_REQUIRED` for easy auditing.
5. No "hookup" framing anywhere. Default tone is intentional, marriage-minded.

## Consequences

### Positive

- One engineer can run all of mobile + backend without changing languages.
- NestJS's module/guard structure scales cleanly when the second engineer joins.
- Owning the auth tables (User / Session / OAuthAccount) makes Covenant + suspension + age-gate enforceable as code paths, not vendor-side toggles.
- Moderation is wired in at v0, so we cannot ship a feature that bypasses it.
- TS + Zod schemas in `packages/shared` keep mobile and API in lockstep.

### Negative / risks

- We own the auth attack surface (token rotation, refresh storage, OAuth verifier security). Mitigated by Argon2id, opaque refresh tokens hashed at rest, JWT secret rotation procedures (documented in deploy ADR).
- Expo managed workflow may need to bail to bare workflow for advanced native modules (e.g. on-device face-detection). EAS supports prebuild + bare; migration path is documented.
- Production Docker build for the api requires `@blesscupid/shared` to be present at runtime; current `Dockerfile` copies the workspace and uses the source-import via TS `paths`. Production-grade build optimization (compiled shared dist, smaller image) is a follow-up.
- Self-hosting auth means we carry incident response for credential stuffing, refresh-token reuse, etc. Mitigation: rate limiting (Fastify `@nestjs/throttler` or Upstash) and Sentry alerting from day one.

## Status of decisions still owed to the Pastor

- Final list of moderation categories and severities (we ship with conservative defaults).
- Faith-questionnaire wording.
- Onboarding copy and the canonical Holy Code of Conduct ("Covenant") text.

These are tracked on the parent goal and must be received before public launch.
