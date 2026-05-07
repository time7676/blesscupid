# v1-restart Status Report

> Branch: `v1-restart` off `development`. Sessions 1-2 (2026-05-06 → 2026-05-07).
> Plan: `~/.claude/plans/i-think-we-need-misty-eclipse.md`
> Companion: `DESIGN.md` (v1 additions)

## Headline (updated 2026-05-07 session 2)

**Lane 1 + Lane 2 + Lane 3 C1+C2 DONE. API + Mobile both typecheck 0 errors. API boots green. 11 commits, +13889 / -14365 lines, 214 files touched. Mobile Lane 3 C3-C7 (tabs/sheets/settings/visual polish) + admin web + tests deferred.**

## What landed

### Commits (in order)

1. `3a6e874` design(v1): DESIGN.md +431 lines — Garden Hours v1 additions, 14 new components, sacred-moment registry, Holy Code anti-patterns, state matrices
2. `cd4c079` feat(schema): v1 Prisma schema hard reset — 28 tables, 26 enums
3. `f2d2424` feat(v1): Lane 1 milestone — DEFERRABLE constraint, deleted 28 module files
4. `a2bdd62` feat(tokens): gold.ring, ink.scrim, parchment.viewfinder
5. `cbb0065` feat(v1): Lane 2 wave 1 — auth + onboarding + matching (~3000 lines)
6. `55976ab` feat(v1): Lane 2 wave 2 — verse + chat + subscription + notifications (~3450 lines)
7. `307acff` feat(v1): status + verification + emailVerifiedAt (~625 lines)

### Lane 1: schema + cuts + tokens — DONE

- New `apps/api/prisma/schema.prisma` (~530 lines): 28 models, 26 enums
- Migration `20260506000000_v1_restart` (754 SQL lines) applied to local dev DB
- Migration `20260506010000_email_verified_at` applied
- DEFERRABLE constraint on `Photo(userId, position)` for reorder swaps
- Deleted modules: `pastor-mode-gate`, `pastor-mode-relationship`, `walking-with`, `kyc`, `coin`, `entitlement`, `moderation-actions`, `quiet-hours`, `phone-auth`
- Deleted mobile dirs: `screens/onboarding-v0/`, `screens/catechism/`
- Tokens added: `color.gold.ring`, `color.ink.scrim`, `color.parchment.viewfinder` (synced to mobile `tokens.ts` + prototype `tokens.css`)

### Lane 2 wave 1: auth + onboarding + matching — DONE

**Auth** (12 files, ~1300 lines): Real OTP for password-reset (5-attempt lockout, 15min, Redis tracking) + email-verify (Redis-only). Apple JWKS + Google JWK verifiers via `jose`. argon2id password hash. zxcvbn-ts ≥3 strength. SendGrid email service (3s timeout, 2 retries). Forgot-password enumeration prevention. OnboardingRejection emailHash check at signup. Refresh-token rotation w/ reuse-detection. Throttle 5/min. Deps: `@sendgrid/mail`, `@zxcvbn-ts/*`, `jose`.

**Onboarding** (7 files, ~750 lines): 8-step controller with `assertStepValid` sequence guard (409 out-of-order). Q3 hard-reject on card 4 (`gender === seeking` → User.delete + `OnboardingRejection.emailHash` audit). DOB UTC ≥18 validation. Step 6 location: lat/lng OR city. Step 7 verse: writes StatusVerse + UserVerseHistory(usedFor=status). Step 8 covenant version `v1.0` + photo[0] + bio (optional, moderated). Zod schemas per step + WhimsicalAnswers strict validator. `email-hash.ts` (sha256 NFKC normalize). Stripped Q3-redirect/Faith/Questionnaire from `packages/shared`.

**Matching** (11 files, ~1200 lines): `services/matching/scoring.ts` with 35/20/15/15/10/5 weight system. New helpers: `distance.ts` (Haversine + bucket + proximityHint), `whimsical-affinity.ts` (16-dim cosine), `church-normalize.ts` (NFKC + punct strip). Match-as-real-table-transactional (SERIALIZABLE isolation). Bless+ undo endpoint (120s window). `candidate-card.dto.ts` privacy-safe (no lat/lng/church pre-match). Anti-Pareto exposure cap (50 viewers/day, Redis SET). `daily-stack.processor.ts` BullMQ cron 04:00 UTC. Cold-start scoring fallback. Deps: `@nestjs/bullmq`, `bullmq`.

### Lane 2 wave 2: verse + chat + subscription + notifications — DONE

**Verse** (~1100 lines): 84-verse pool (12 themes × 7 verses), BSB English + LAI TB Indonesian. `pickAvailable({userId, themeTag?, usedFor, excludeRefs?})` single de-dup helper. `pickAnchorFor(userAId, userBId)` for thread creation. `dailyPick(userId, themeTag?)` for status. `suggestionsForThread(threadId, viewerId)` returns 3 ranked openers (anchor → whimsy → generic), 12 themes × 2 locales × 5 templates. Seed file with PastorApproval rows (`verse_seed v1`, `banned_phrases v1`, `covenant v1`). Refuses NODE_ENV=production. WEB/BSB chosen for English (copyright-safe public domain).

**Chat** (~750 lines): Idempotent send via `(threadId, clientMessageId)` unique. Bidirectional Block guard (403 if blocked). TextClassifier integration: `block`→403, `queue`→deliver+ModerationQueueItem. Cursor pagination (base64url `{lastId, lastCreatedAt}`). archive/unarchive. Throttle 30/min. DTOs separated. Deleted `chat-extension.controller.ts`, `evidence-freeze.guard.ts`, `chat-blocks.test.ts`. **Known: unread is approximate** (no per-viewer last-seen-at marker yet — flagged in code as `// BLOCKER:`).

**Subscription** (~750 lines): Single Bless+ tier × 4 cycles (29k/99k/269k/990k IDR). 7-day trial via Xendit recurring `firstChargeAfterDays=7`. One-trial-per-user enforcement. Cancel branches: trialing → immediate revert, active → honor expiresAt. `expireSubscriptions()` cron stub. Xendit fetch wrapper w/ Basic auth + 3-attempt retry on 5xx. Webhook fail-closed: 401 on missing/wrong x-callback-token. Idempotency: `(eventType, eventId)` deduped via `PaymentTransaction.metadata.processedEvents[]`. Coin economy fully removed.

**Notifications** (~850 lines): `DeepLinkTarget` union (today | thread:id | profile:id | verify | upgrade | status). `FirebaseService` with lazy boot from `FIREBASE_SERVICE_ACCOUNT_KEY`. Inline `i18n.ts` (replaces I18nModule TODO). 100-char body truncation. `push-fanout` BullMQ processor: APNs collapse-id, Android collapseKey, silent → content-available, stale token cleanup. In-app feed cursor pagination. `markRead`/`markAllRead`. Helpers `notifyMatch`/`notifyMessage`/`notifyVerification` w/ collapse-id.

### Lane 2 simpler modules (built directly) — DONE

**Status** (3 files, ~225 lines): Sticky StatusVerse from curated 84-pool. Validates verseRef in pool. Localizes per user.localePreference. Writes UserVerseHistory(usedFor='status'). `GET /v1/status/me`, `POST /v1/status`, `DELETE /v1/status/me`, `GET /v1/status/user/:id`, `GET /v1/status/suggest`.

**Verification** (4 files, ~350 lines): Selfie face-match via AWS Rekognition CompareFaces vs Photo[0]. Auto-approve ≥90, else admin queue. 24h rate limit per user via Redis. Dev fallback returns 95 when `AWS_REKOGNITION_ENABLED` unset. Inline `AdminGuard` (User.role === 'admin' check). Admin endpoints under `/v1/admin/verification`. `notifications.notifyVerification` integration.

## Lane 1 + Lane 2 — DONE (session 2 close-out, 2026-05-07)

API now compiles + boots clean. All 23 NestJS modules instantiate. Wave 3 cleanup landed:

- **account** ✓ — `/v1/me*` endpoints, soft-delete via User.deletedAt, 30d hard-delete worker, bio writes Profile.bio
- **photos** ✓ — image-variants.processor (sharp 200/800/2000 variants), photo-moderation-retry.processor, photos.queues, EXIF strip path
- **reports** ✓ — POST /v1/reports + admin queue + resolve, simplified (no EvidenceFreeze)
- **admin** ✓ — moderation-queue + admin-monetization, AdminGuard role check
- **waitlist** ✓ — AdminGuard on CSV export
- **blocks** ✓ — uses moderation/prisma-moderation-store
- **chat/prisma-moderation-store** → moved to **moderation/prisma-moderation-store** ✓
- **VerseService DI** ✓ — fixed dual-shape constructor → @Inject(PrismaService) + optional VERSE_FETCHER token
- **BullModule.forRoot** ✓ — connection wired in app.module.ts

**Smoke results:**
- `pnpm --filter @blesscupid/api exec tsc --noEmit` → 0 errors
- `pnpm dev` → "Nest application successfully started"
- All 23 modules + BullMQ + ThrottlerModule + JwtModule load clean

## Lane 3 C1 + C2 — DONE (session 2)

Mobile NOW BUILDS. `pnpm --filter @blesscupid/mobile exec tsc --noEmit` → 0 errors.

- **i18n**: i18next + react-i18next + expo-localization. en.json + id.json under `v1.*` namespace (~250 keys per locale).
- **8-card onboarding**: OnboardingFlow driver + 8 cards in `screens/onboarding/cards/`:
  - Card1Animal, Card3Sunday, Card5Afternoon, Card7Verse → composes WhimsicalCard shared base
  - Card2NameDob, Card4Identity (Q3 hard-reject signal), Card6Location, Card8Photo → custom essentials
  - OnboardingDone (4s auto-advance), Q3RejectSheet (amber-not-red destructive)
- **api-onboarding.ts**: client wraps /v1/onboarding/* + verse picker stub
- **App.tsx**: rewritten — single OnboardingFlow render, initI18n at boot, removed Storybook gate
- **api.ts**: cut 155 lines of legacy onboarding endpoints; MeResponse type added inline; /v1/me path

**Visual state:** cards are compilable stubs, not Garden Hours-finalized. Real polish per DESIGN.md (Cormorant headers, gold-halo rings, sandstone-warm fills with gold borders, Continue button pressed/disabled states, ProgressDots) is next-session work.

## Lane 3 C3-C7 — DEFERRED

Remaining mobile work:
- C3: AppShell linking config (deep-link routing for push)
- C4: Today (SwipeCard w/ Status ring, ActionDeck w/ Bless+ undo)
- C5: Matches tab (Likes-You + Connections sections)
- C6: Chats list + Thread (verse-share + suggestion chips)
- C7: You hub + 12 settings sub-screens
- Sheets: StatusComposer, VerifySelfie, NotificationsSheet, UpgradeSheet, ReportSheet, BlockConfirm, MatchSheet ceremony
- ProfileDetail full sheet
- Visual polish across all surfaces per DESIGN.md spec

## What's NOT done (deferred to future sessions)

- **Lane 3: Mobile rebuild** — i18n setup (en+id), navigation linking config, 8-card onboarding, Today (Status ring on photos, ActionDeck w/ 5s undo), Matches tab, Chats list, Thread (verse-share + suggestion chips), You hub, all settings sub-screens (12), StatusComposer, VerifySelfie, NotificationsSheet, UpgradeSheet, ReportSheet, BlockConfirm, AccountDeletion, MatchSheet ceremony.
- **Lane 4: Tests** — 26 unit/integration test files (Vitest), 8 Maestro E2E flows, 1 verse-dedup eval test. Plus regression-critical: `account/hard-delete.worker.test.ts`, `payment/webhook.idempotency.test.ts`, `services/moderation/test/*`.
- **`apps/admin/` Next.js scaffold** — admin web app at `admin.blesscupid.com` for moderation queue, verification queue, reports, Bull Board. Plan §"Admin web design" spec.
- **CONTRIBUTING.md, docs/onboarding-new-dev.md** — internal-team DX docs.
- **CI updates** — pipeline reflecting reduced module list.
- **Pre-launch ops sequence** (D-7 to D+14) — Apple Dev fee, Cloudflare proxy, alpha re-signup notice, EAS channel cut, store metadata. **User-side actions, not CC.**

## Next session resume

Start by running:
```bash
cd /Users/julian/Documents/Development/blesscupid/ble-development
git checkout v1-restart
pnpm install
pnpm --filter @blesscupid/api exec prisma generate
pnpm --filter @blesscupid/api exec tsc --noEmit 2>&1 | head -50
```

The TypeScript errors map to the modules in "Known Breakage" above. Recommended approach:

1. Dispatch parallel agents for modules 1–7 (cleanup waves of 3–4 each)
2. Add BullModule.forRoot connection config to app.module.ts
3. Smoke-test API boot with `pnpm dev:api` once typecheck green
4. Then start Lane 3 mobile rebuild (massive — ~32 surfaces per DESIGN.md)
5. Then Lane 4 tests
6. Then admin web

## Files of note

- `/Users/julian/.claude/plans/i-think-we-need-misty-eclipse.md` — full plan
- `DESIGN.md` — v1 design canon
- `apps/api/prisma/schema.prisma` — v1 schema source of truth
- `apps/api/prisma/seed.ts` — calls verse seeder + PastorApproval rows + dogfooders
- `services/matching/src/scoring.ts` — pure scoring logic
- `apps/api/src/verse/verse-pool.ts` — 84-verse content
- `apps/api/src/verse/suggestion-templates.ts` — 120+ chat opener templates
