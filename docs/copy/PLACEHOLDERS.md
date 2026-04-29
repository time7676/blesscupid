# Onboarding Copy — Pastor Contract

All user-facing strings on the onboarding flow listed below were authored or signed off
by the Pastor (BLE-41) and wired into mobile + API in **BLE-124**. Engineering does
not author this copy.

**Hard rule (AGENTS.md):** UX copy that touches faith, relationships, or moderation must be
reviewed by the Pastor before shipping. Engineering does not author this copy.

## Source of truth

- [User Covenant v1](/BLE/issues/BLE-41#document-user-covenant) — verbatim seven-clause covenant body, decline note, same-sex redirect note.
- [Onboarding Questionnaire v1](/BLE/issues/BLE-41#document-onboarding-questionnaire) — Q1–Q9 prompts, options, redirect copy, soft-intro for Q7.
- [Holy Code of Conduct v1](/BLE/issues/BLE-4#document-holy-code-of-conduct) — predicate references for every gate the questionnaire enforces.

The mobile app loads strings from `apps/mobile/src/i18n/en.json` via `apps/mobile/src/i18n/copy.ts`.
`COVENANT_VERSION` is bumped to `v1` in `packages/shared/src/onboarding.ts`. Existing
users with the prior `v0-placeholder` signature must re-accept the covenant before
re-entering surfaces that require it.

## Status

| Area | Source | i18n key root | Pastor-signed |
|---|---|---|---|
| User Covenant body (clauses 1–7) | BLE-41 user-covenant doc | `covenant.body` | yes (v1) |
| Covenant intro paragraph | BLE-41 user-covenant doc | `covenant.intro` | yes (v1) |
| Covenant acknowledgment paragraph | BLE-41 user-covenant doc | `covenant.acknowledgment` | yes (v1) |
| Covenant CTAs ("I agree" / "This isn't for me") | BLE-41 user-covenant doc | `covenant.acceptCta` / `covenant.declineCta` | yes (v1) |
| "If you tap This isn't for me" copy | BLE-41 user-covenant doc | `covenant.declineNote` | yes (v1) |
| Same-sex redirect note (covenant page) | BLE-41 user-covenant doc | `covenant.sameSexNote` | yes (v1) |
| Q1 age gate hard-reject message | BLE-41 questionnaire doc | `ageGate.errorUnderage` | yes (v1) |
| Q2 surface-routing prompt + 4 options | BLE-41 questionnaire doc | `questionnaire.q2.*` | yes (v1) |
| Q3 dating-side seeking prompt + 4 options | BLE-41 questionnaire doc | `questionnaire.q3.*` | yes (v1) |
| Q3 same-sex redirect modal copy (verbatim, frozen) | BLE-41 questionnaire doc | `questionnaire.q3.redirect.*` | yes (v1, frozen) |
| Q4 tradition prompt + 8 options | BLE-41 questionnaire doc | `questionnaire.q4.*` | yes (v1) |
| Q5 walk stage prompt + 6 options | BLE-41 questionnaire doc | `questionnaire.q5.*` | yes (v1) |
| Q6 marriage-open prompt + 3 options | BLE-41 questionnaire doc | `questionnaire.q6.*` | yes (v1) |
| Q7 welcomed-tags soft intro + 5 options | BLE-41 questionnaire doc | `questionnaire.q7.*` | yes (v1) |
| Q7 visibility helper line | BLE-41 questionnaire doc | `questionnaire.q7.visibilityHelper` | yes (v1) |
| Q8 practice-rhythm prompt + 7 options | BLE-41 questionnaire doc | `questionnaire.q8.*` | yes (v1) |
| Q9 bio-seed prompt + soft-flag copy | BLE-41 questionnaire doc | `questionnaire.q9.*` | yes (v1) |
| Photo rejection messages | BLE-53 (existing) | `photo.rejection.*` | yes |
| Bio rejection messages | BLE-53 (existing) | `bio.rejection.*` | yes |
| Moderation message-level copy | BLE-53 (existing) | `moderation.*` | yes |
| Reviewer queue copy | BLE-53 (existing) | `reviewer.*` | yes |

## Frozen strings

The Q3 same-sex redirect copy (`questionnaire.q3.redirect.body`) is **frozen** per
[Holy Code §4.2](/BLE/issues/BLE-4#document-holy-code-of-conduct). Tone changes require Pastor sign-off
*and* CEO awareness, per the user-covenant doc's versioning note.

## Engineering checklist (closed for BLE-124)

- [x] Pastor signs the canonical covenant text + questionnaire copy.
- [x] Engineering loads final copy into `apps/mobile/src/i18n/en.json` (verbatim).
- [x] Bio/photo rejection error keys preserved so the API can return reason codes.
- [x] `COVENANT_VERSION` bumped to `v1` in `packages/shared/src/onboarding.ts`.
- [x] No "hookup", "casual", or romantic-secular framing ships in onboarding strings.

## Translation slots

- **English (`en.json`)** — authoritative source, shipped in v1.
- **Bahasa Indonesia (`id.json`)** — Pastor-reviewed pass before launch (out of scope for
  BLE-124; tracked separately).
- **Mandarin Chindo** — reserved for v1.1.

Free-text fields (Q4 "Other", Q9 bio seed) accept any UTF-8 unchanged.

## v1 → v2 review trigger

Re-evaluate **90 days post-launch** or after the **first 1,000 completions**, whichever
comes first. See [BLE-41 questionnaire v1 → v2 trigger](/BLE/issues/BLE-41#document-onboarding-questionnaire).
The seven covenant clauses, Q1 age gate, and Q3 v1 dating scope are stable across v2.
