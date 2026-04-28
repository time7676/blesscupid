# @blesscupid/matching

Faith-aligned matching engine for BlessCupid. Rules-based v1 (BLE-8).

## What it does

- Builds a **daily curated stack** of 10–20 candidates per user (deterministic per-user/per-day).
- Scores pairs by faith-first weights:
  - **denomination** (30) — biggest factor
  - **marriage intent** (25)
  - **geo proximity** (15)
  - **age fit** (15)
  - **church attendance** (10)
  - **shared spiritual gifts** (5, optional)
- Hard-gates eligibility on holy guardrails: 18+ verified, covenant signed, photo + bio moderation passed, no banned/suspended accounts, gender preference both-sides.
- **Mutual interest gate**: chat is locked until both users have expressed interest. No super-likes, no monetized urgency, no hookup framing in code or copy.
- **PII sanitizer** projects candidates to a public shape — strips email, phone, exact coordinates, score breakdown, and viewer-only state.
- **Push notification interface** fires only when a NEW match is created (idempotent).

## Layout

```
src/
  types.ts            shared types (faith profile, candidate, score breakdown)
  scoring.ts          per-factor scoring + eligibility gate
  daily-stack.ts      buildDailyStack(viewer, pool, opts)
  mutual-interest.ts  expressInterest(), canChat(), in-mem store reference
  sanitize.ts         sanitizeForClient() — never leak PII
  index.ts            barrel
test/                 vitest suites: 23 tests covering acceptance criteria
```

## Running

```bash
npm install
npm test
npm run typecheck
```

## Plugging into the API service

The engine is a **pure library**. The API layer (BLE-6 scaffold) wires it up:

1. Cron (or on-demand cache fill) calls `buildDailyStack(viewer, candidatePool, { day })` per active user once a day. Persist the resulting userIds to a `daily_stacks` table.
2. `GET /matches/daily` reads the stored stack and returns `sanitizeForClient(viewer, candidate, score)` for each entry. **No raw `CandidateProfile` ever leaves the API.**
3. `POST /matches/:userId/express-interest` calls `expressInterest()` with a Postgres-backed `InterestStore` and an APNs/FCM-backed `NotificationDispatcher`.
4. Chat handler checks `canChat(a, b, store)` before opening any thread.

## Acceptance traceability (BLE-8)

| Requirement                                        | Verified by                              |
| -------------------------------------------------- | ---------------------------------------- |
| Daily curated stack of 10–20                       | `daily-stack.test.ts`                    |
| Faith factors weighted highest                     | `scoring.test.ts`                        |
| Test users get distinct, sensible stacks           | `daily-stack.test.ts` (distinct viewers) |
| Mutual interest required to chat                   | `mutual-interest.test.ts`                |
| Match notifications fire on mutual                 | `mutual-interest.test.ts`                |
| No PII in matching API responses                   | `sanitize.test.ts`                       |
| No super-like / hookup framing                     | code review — engine has no such surface |

## Deferred (intentional)

- **ML scoring** — explicitly out of scope per ticket. Instrument current rules first.
- **Production storage adapters** — Postgres-backed `InterestStore`, APNs/FCM `NotificationDispatcher`. Implemented in the API service once BLE-6 scaffold lands.
- **Daily-stack cache invalidation** — when a user updates faith profile mid-day, stack is rebuilt next cron tick. Acceptable for v1.

## Holy guardrails enforced in code

- 18+ verification required on both sides (`isEligible`).
- Covenant signature required on both sides (`isEligible`).
- Photo + bio moderation must have passed before a candidate enters any pool (`isEligible`).
- Banned/suspended accounts never appear (`isEligible`).
- No "score breakdown" leaks to the client (sanitize layer).
- No raw coordinates leak; distances are 1km-bucketed (sanitize layer).
