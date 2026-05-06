# Privacy Policy

**Effective date:** 2026-05-06
**Last updated:** 2026-05-06

This Privacy Policy explains how BlessCupid ("we", "us", "our") collects, uses, and protects your information. BlessCupid is operated by COCON Inc. ("COCON"), Tokyo, Japan, with primary processing in Singapore.

This policy is written in plain language. Where Indonesian Personal Data Protection Law (UU PDP), GDPR, or California CCPA require specific disclosures, those follow at the end.

## 1. Who we are

BlessCupid is a faith-first dating app for committed Christians. Contact: privacy@blesscupid.com.

## 2. Information we collect

### From you, directly
- **Account:** email address, password (hashed with Argon2id, never stored in plain text), date of birth (used for the 18+ age gate; never displayed publicly).
- **Profile:** legal name (private, used only by safety/moderation team for reports), nickname (public), gender, city, country, faith tradition, walk stage, marriage timeline, intent, conversation prompts.
- **Photos:** images you upload. Stored in Cloudflare R2 with private access; URLs are signed and short-lived.
- **Bio:** the short biography you write. Runs through automated moderation before publication.
- **Messages:** conversations you have with other users. Encrypted in transit; stored at rest.
- **Reports + blocks:** when you report or block another user, we keep that record.

### Automatically
- **Device:** device type, OS version, app version, locale, timezone.
- **Analytics:** product usage events (signup, profile open, decision made, message sent). We use PostHog for this. Events are tied to your account ID; no message content is logged.
- **Crash + error:** Sentry collects stack traces when the app crashes or the API errors. Personal identifiers are scrubbed.

### Things we do **not** collect
- We do **not** collect precise GPS coordinates. Location is captured at the city level only.
- We do **not** access your contact list, photo library beyond what you upload, microphone, or calendar.
- We do **not** collect biometric data outside of optional liveness verification (and that data is processed only by AWS Rekognition; we keep no permanent biometric record).

## 3. How we use information

- To provide the matching service, daily introductions, conversations.
- To enforce the Holy Code of Conduct (moderation, banned-phrase detection, threat detection).
- To process safety reports + block users who violate the code.
- To improve the product through aggregate analytics.
- To meet legal obligations (age verification, court orders, fraud prevention).

We **do not sell** your personal information.

## 4. How we share information

| With | Why | What |
|---|---|---|
| Other BlessCupid users | To show your profile to potential matches | Public profile fields only: nickname, age, city, faith, photos, bio. Never legal name, email, phone, exact location. |
| Cloudflare R2 (storage) | Photo storage | Photos + storage keys |
| AWS Rekognition (moderation) | Image safety scans | Photo bytes, ephemeral |
| Google (Gemini) | Text moderation | Message + bio text, ephemeral |
| Xendit (payments) | Subscription billing | Name, email, billing address |
| PostHog (analytics) | Product analytics | Account ID + event metadata, no message content |
| Sentry (crash) | Crash + error logs | Stack traces, scrubbed |
| Apple / Google (sign-in) | OAuth, when enabled | Provider-issued ID token |
| Law enforcement | Court orders + safety emergencies | What is legally required |

## 5. How long we keep your data

- **Account + profile:** until you delete your account.
- **Account deletion:** `Settings → Delete account` triggers a 30-day soft delete (recoverable). After 30 days, hard delete from the primary database. Backups age out within 90 days of hard delete.
- **Messages:** retained while either party has an active account. Hard-deleted with the deleting party's account.
- **Reports + safety logs:** retained for **2 years** for moderation precedent + legal compliance, even after account deletion.
- **Analytics events:** PostHog default 7-year retention. We will lower this in v1.1.
- **Crash logs:** Sentry default 90 days.

## 6. Your rights

You can:
- **Access:** request a copy of all data we hold about you. Email privacy@blesscupid.com.
- **Correct:** edit your profile in-app, or email us for fields the app doesn't expose.
- **Delete:** delete your account in-app (`Settings → Delete account`).
- **Object / restrict:** opt out of analytics in `Settings → Privacy`. Opt out of marketing emails any time.
- **Portability:** request a data export in JSON.

For Indonesian residents (UU PDP), GDPR-covered residents, and California residents, additional rights apply (see §10 below).

## 7. Security

- Passwords hashed with Argon2id (RFC 9106).
- Transport: TLS 1.2+ for all client-server traffic. HSTS enabled on api.blesscupid.com.
- Authentication: short-lived JWT access tokens (15 min) + refresh rotation. Refresh tokens revocable per device.
- Rate limiting on auth endpoints to slow credential stuffing.
- Encryption at rest: Postgres standard disk encryption + R2 server-side encryption.
- We do not store your password in any recoverable form. If you forget it, we can only reset it.
- Annual security review.

## 8. Children

BlessCupid is **18+ only**. The signup flow enforces a date-of-birth check. We do not knowingly collect data from anyone under 18. If we discover an account belongs to a minor, we delete it immediately and notify the registered email.

## 9. International transfers

BlessCupid runs on a Japanese-hosted VPS for primary services. Cloudflare R2 stores photos in Asia-Pacific. PostHog (US/EU), Sentry (US/EU), Xendit (Indonesia), AWS (ap-northeast-1), Google (regional). By using BlessCupid, you consent to these transfers.

## 10. Region-specific rights

### Indonesia — UU PDP (Law 27/2022)
You are the data subject (subjek data pribadi). COCON Inc. is the data controller (pengendali data pribadi). You have the right to access, correct, delete, restrict, object, and request portability. Local representative for Indonesian users: contact privacy@blesscupid.com (regional office is being established).

### European Union / UK — GDPR
Lawful basis: consent for marketing analytics; contract for service operation; legitimate interest for safety/moderation; legal obligation for age verification + court orders. You may lodge a complaint with your national supervisory authority.

### California — CCPA
We do not sell personal information. You may request access, deletion, and correction. To submit, email privacy@blesscupid.com with subject "CCPA Request".

## 11. Changes

We will notify you of material changes via in-app notification + email at least 14 days before they take effect. Continued use after that date constitutes acceptance.

## 12. Contact

privacy@blesscupid.com — privacy questions
support@blesscupid.com — general support
abuse@blesscupid.com — safety reports + abuse

Mailing address (legal):
COCON Inc.
[address pending registration]
Tokyo, Japan
