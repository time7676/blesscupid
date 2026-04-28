# ADR 0002 — Safety + Reporting Architecture

Status: Accepted (BLE-10)
Date: 2026-04-28
Last revised: 2026-04-28 (v2 — added Prisma binding in `apps/api`)
Owner: Founding Engineer

## Context

BlessCupid is a faith-first dating app. The Pastor's Holy Code of Conduct
demands hard guardrails against harassment, sexual content, impersonation,
and coercive messaging. Beyond ML-based moderation (BLE-9), users need
first-party safety controls: **report**, **block**, **delete account**, and
a **trust & safety review surface** for the Pastor + CEO.

Acceptance bar (from BLE-10):

- A user can report another user in **<30 seconds**.
- Blocked users **cannot see or contact** each other (bidirectional).
- Account deletion **fully removes PII within 30 days** (GDPR + CCPA).
- Reported chat threads are **frozen server-side for 90 days** for moderator review.

## Decision

Implement safety as a **standalone service module** (`services/safety/`)
mirroring the pattern of `services/matching/`: pure TypeScript domain logic
with an injected repository interface, so the storage layer (Postgres via
Prisma/Drizzle, picked in BLE-6 follow-up) can drop in without touching
business rules. Domain types live in `packages/shared` so the mobile client
and API gateway both consume the same shape.

### Domain entities

| Entity                     | Purpose                                                                                |
| -------------------------- | -------------------------------------------------------------------------------------- |
| `Report`                   | A user's complaint about another user. Reason + free-text + optional screenshot ref.   |
| `Block`                    | A bidirectional, instant relation that hides all history between two users.            |
| `EvidenceFreeze`           | A 90-day server-side freeze on a chat thread referenced by an open report.             |
| `AccountDeletionRequest`   | A two-stage delete: soft (immediate UX removal) → hard (PII purge) within 30 days.     |
| `ModerationAction`         | The Pastor/CEO's resolution: dismiss, warn, suspend, ban. Logged for audit.            |

### Report flow (<30s budget)

1. Client opens chat → tap profile → "Report user" (1 tap).
2. Reason picker — `harassment | sexual_content | impersonation | other` (1 tap).
3. Optional free-text (≤500 chars) and **one** screenshot (≤5 MB, image/* only).
4. `POST /reports` returns `202 Accepted` immediately; backend:
   - persists the `Report` with `status = open`,
   - enqueues an `EvidenceFreeze` over the involved `chatThreadId` for 90 days,
   - emits a `report.created` event for the T&S queue.

The mobile screen pre-loads the picker so steps 1–3 collapse to two screens.
Submit is non-blocking — no waiting on server confirmation. Field test budget:
< 30s wall clock from "open chat" to "submitted".

### Block: instant + bidirectional

`POST /blocks { blockedUserId }` writes a single row keyed on the unordered
pair `(min(userA, userB), max(userA, userB))`. Every read path —
match-feed, chat-list, profile-view, push fan-out, notification delivery —
filters against an in-memory bloom + Redis-cached block-set, with the
relational table as ground truth. Either party can unblock; the row is
removed. There is no "blocked you" leak: the other user simply sees the
account as deleted/inactive.

### Account deletion (GDPR + CCPA)

Two-stage:

1. **Soft delete (T+0).** Sets `deleted_at`, scrubs display name to
   `"Removed"`, removes from all match candidate sets, expires push tokens,
   forces logout. Chat partners see "User deleted account."
2. **Hard delete (T+30 days).** A nightly worker hard-purges:
   `users`, `profiles`, `photos` (S3), `messages.body` (replaced by
   tombstone `[deleted]`), `reports.reporter_user_id` (anonymized),
   `audit_log` rows older than 30 days that reference deleted user.
   Exceptions retained: `moderation_actions` keyed by hashed user id (for
   ban-evasion detection), and rows under active `EvidenceFreeze`.

The 30-day hold doubles as an undo window and matches the GDPR "reasonable
delay for backups" precedent. CCPA users can request immediate hard delete
via support; the worker honours an `expedited` flag.

### Evidence preservation

When a `Report` references a `chatThreadId`, an `EvidenceFreeze` row
locks message redaction on that thread for 90 days. The chat service
**MUST** consult the freeze table before redacting, deleting, or applying
hard-delete to any message in the thread. Account-deletion hard-purge
respects active freezes — message bodies stay until the freeze expires
and are then purged in the next nightly run.

90 days = comfortable upper bound on Pastor + CEO triage SLA, with margin
for legal hold escalation.

### T&S queue

`GET /admin/safety/queue` returns open reports ordered by:

1. Severity score (computed from reason + reporter history + classifier signals).
2. Age (older first).
3. Reporter trust (verified accounts > new accounts).

`POST /admin/safety/reports/:id/action` records a `ModerationAction`,
auto-resolves linked reports, fires the appropriate user-state change
(suspend / ban / warn / dismiss), and notifies the reporter that "We
reviewed your report."

### Out of scope (for BLE-10)

- DB binding (Prisma vs Drizzle) — decided in BLE-6 follow-up.
- Mobile UI screens — BLE-7 ships profile/chat shells first.
- Admin dashboard frontend — separate ticket once `apps/admin` exists.
- Image/text classifier integration on the report screenshot — handled
  by BLE-9's moderation pipeline; safety service emits the moderation event.

## Consequences

**Positive.** Pure-domain module is unit-testable with `vitest` today,
without infra. Repository interface defers DB choice. Shared types prevent
client/server schema drift. 30-day delete + 90-day evidence freeze are
codified, not folklore.

**Negative.** Without a real DB binding, integration risks aren't yet
covered (transactional consistency between `Report` insert and
`EvidenceFreeze` insert; race between block-write and message-fanout).
Tracked as follow-ups; first round of vitest tests proves the rules.

**Holiness alignment.** Block is bidirectional and silent — no flirty
"blocked-you" mind games. Report copy is neutral and trauma-informed
(awaits Pastor review, per AGENTS.md hard rule). Account deletion is a
hard right, not a dark-pattern obstacle course.
