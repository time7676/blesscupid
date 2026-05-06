# UU PDP (Indonesia) — Compliance Runbook

Per Law 27/2022 (UU Pelindungan Data Pribadi). This document maps each obligation to its implementation in the BlessCupid stack. Maintained by DPO.

## Roles

| Role | Person / contact |
|---|---|
| Data Controller (Pengendali Data Pribadi) | COCON Inc., Tokyo |
| Data Processor(s) (Prosesor) | Cloudflare R2 (storage), AWS (Rekognition), Google (Gemini), PostHog (analytics), Sentry (error logs), Xendit (payments) |
| DPO (Petugas Pelindungan Data) | dpo@blesscupid.com |
| Local Representative (Perwakilan di Indonesia) | TBD pre-launch (sponsoring entity in Indonesia) |
| Authority | Lembaga Pelindungan Data Pribadi (forming) |

## Obligation matrix

| UU PDP article | Obligation | Implementation |
|---|---|---|
| **Pasal 4-15** | Data subject rights (access, correction, deletion, restriction, objection, portability, withdraw consent) | `GET /me` (access), profile editing (correction), `DELETE /me` (deletion, 30-day soft-delete), `Settings → Privacy` (analytics opt-out), `GET /me/export` (portability), `POST /me/restore` (cancel deletion) |
| **Pasal 9** | Response within 3×24 hours | `/me` + `/me/export` are synchronous. Manual privacy@blesscupid.com requests answered within 3 business days. |
| **Pasal 20 ayat 2 huruf a** | Explicit consent | Signup form has two unchecked-by-default checkboxes: service consent (required) + analytics consent (optional). Consent timestamp persisted in `User.createdAt` + `Profile.welcomedTagVisibility` JSON for granular tag visibility |
| **Pasal 20 ayat 2 huruf b** | Contract performance | Documented in Privacy Policy §3 |
| **Pasal 20 ayat 2 huruf f** | Legitimate interest | Moderation, safety. Documented in Privacy Policy §3 |
| **Pasal 21** | Withdrawal of consent | Settings → Privacy in mobile app; analytics opt-out via PostHog `optOut()` (already wired in `analytics.ts`) |
| **Pasal 25-29** | Lawful processing principles | Argon2id for passwords; TLS 1.2+ in transit; disk encryption at rest; minimum-data principle (legalName separated from displayName; coarse city only, no GPS) |
| **Pasal 30** | Cross-border transfer | Privacy Policy §10 lists each transfer + adequacy basis (Japan, Singapore, EU adequacy decisions) |
| **Pasal 35** | Records of processing | This runbook + automated logs in PostHog/Sentry. Audit trail in `ModerationActionLog` (Prisma) |
| **Pasal 36** | Security obligation | `/cso` audit shipped 2026-04-30; rate-limited auth; throttler 5/min; account lockout deferred to v1.1 |
| **Pasal 46** | Breach notification — within 3×24h to authority + subjects | Runbook in this doc §Breach Response below |
| **Pasal 50** | Children's data | Age gate 18+; DOB validated at signup; Privacy Policy §9 |
| **Pasal 52** | DPO designation (mandatory if processing scale large or sensitive data) | dpo@blesscupid.com active. Local rep designation pending pre-launch |
| **Pasal 56** | International data transfer | Adequacy decisions documented; Standard Contractual Clauses available on request |
| **Pasal 57** | Cooperation with Lembaga | Will register when Lembaga is operational. Authority contact channels in this runbook |
| **Pasal 65** | Indonesian jurisdiction for Indonesian users | Terms §11 — for users in Indonesia, Indonesian law applies, Pengadilan Negeri Jakarta Pusat |

## Consent record schema (in Prisma)

`User.createdAt` — implicit consent timestamp (account creation = consent).

For granular consent, use `Profile.welcomedTagVisibility` JSON (already exists per BLE-124) extended at v1.1 to include:

```json
{
  "service": { "consented": true, "at": "2026-05-06T12:00:00Z", "version": "1.0" },
  "analytics": { "consented": false, "at": "2026-05-06T12:00:00Z", "version": "1.0" },
  "marketing": { "consented": false, "at": null, "version": "1.0" }
}
```

For v1, the boolean is captured at signup and the user can withdraw via Settings → Privacy. v1.1 adds the persistent JSON.

## Breach Response Runbook (Pasal 46)

**Trigger:** any security incident leading to unauthorized access, disclosure, alteration, or destruction of personal data.

**Decision tree:**

1. **Detect** — Sentry alert / Pastor report / user report / on-call paged.
2. **Confirm** — DPO + Julian assess scope within 4h. Document: when, what data, how many subjects, root cause.
3. **Contain** — rotate compromised credentials, suspend impacted accounts, kill suspect processes.
4. **Notify Lembaga** — within 3×24h: written notice with scope, root cause, mitigation, contact. Email pdp-pengaduan@kominfo.go.id (or Lembaga's official channel when established).
5. **Notify subjects** — within 3×24h: email each affected user + in-app banner with: what happened, what data, what we're doing, what they should do, how to contact us.
6. **Post-mortem** — Sentry ticket + docs/deploy/incidents/<date>.md + this runbook updated with lessons.

## Indonesian-specific code paths

- **Bahasa Indonesia copy:** legal pages live at https://blesscupid.com/{privacy,terms,holy-code} in Bahasa. English at /privacy/en etc. (TODO).
- **Local time zone:** server uses UTC; mobile renders in `Asia/Makassar` (WITA) for Bali users via device locale.
- **Indonesian phone format:** PhoneAuth module supports +62 prefix.
- **Xendit:** primary payment provider for Indonesian e-wallets.

## Annual review

DPO reviews this runbook every 12 months or after any material legal change. Last review: 2026-05-06. Next review due: 2027-05-06.

## Quick reference

- DPO email: dpo@blesscupid.com
- Privacy email: privacy@blesscupid.com
- Abuse email: abuse@blesscupid.com
- Authority (placeholder until Lembaga operational): pdp-pengaduan@kominfo.go.id
- Breach SLA: **3×24 hours** (notify both authority and subjects)
- Data subject request SLA: **3 business days** (Pasal 9)
