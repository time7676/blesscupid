# App Store + Play Store launch checklist

Per BLE eng-review 2026-05-06. Status as of v1 prep, prior to Apple Developer paid account purchase.

## Block 1 — Code + infra (DONE / IN PROGRESS)

| Item | Status | Notes |
|---|---|---|
| Lane A onboarding stubs filled | ✅ | nickname / legalName / gender / city forms shipped |
| /me endpoint + reinstall regression | ✅ | server-side onboardingCompleted flag |
| Lane B matching API + cron + decision UI | ✅ | GET /matches/today, POST /matches/decision, @Cron('0 4 * * *') |
| Lane C moderation queue persisted | ✅ | ModerationQueueItem in Prisma schema, ModerationActionLog wired |
| Lane E PostHog 8 events | ✅ | requires `EXPO_PUBLIC_POSTHOG_KEY` set |
| Lane F matching predicate indexes | ✅ | seeking+intent, tradition+walkStage |
| Lane G Maestro E2E flows (7 critical) | ✅ scaffolded | flows in `apps/mobile/.maestro/` |
| Lane D FCM push + Firestore | ⏳ blocked | needs `firebase login` + project creation |
| OAuth Apple + Google | ⏳ off | gated `EXPO_PUBLIC_OAUTH_ENABLED=1`, default off for v1 |
| Face detect at photo | ⏳ off | `PHOTO_FACE_DETECT_ENABLED=0`, default off for v1 |
| Gemini moderation | ✅ | default provider, key in `apps/api/.env` |
| Production deploy script | ✅ | `/srv/blesscupid/deploy.sh` |
| TLS + nginx + DNS | ✅ | api.blesscupid.com via Letsencrypt |
| Postgres backups | ⏳ verify | script at `/srv/blesscupid/backup.sh`, confirm cron + R2 upload |
| Sentry | ⏳ wire DSN | `SENTRY_DSN=` blank in .env |

## Block 2 — Legal (DONE)

| Item | Status | URL after deploy |
|---|---|---|
| Privacy Policy | ✅ drafted | https://blesscupid.com/privacy |
| Terms of Service | ✅ drafted | https://blesscupid.com/terms |
| Holy Code of Conduct | ✅ drafted | https://blesscupid.com/holy-code |

Source files: `docs/legal/{privacy,terms,holy-code}.md`. Convert to HTML and host on the teaser site. Pastor must read both before public launch (blanket approval covers v1 baseline; final pre-launch sign-off recommended).

## Block 3 — Apple Developer ($99/yr, blocks everything below)

| Item | Status |
|---|---|
| Apple Developer paid account | ⏳ NEEDS PURCHASE |
| App Store Connect: app record | ⏳ |
| App Store Connect: bundle ID `com.julianloh.blesscupid` (production, not -dev) | ⏳ |
| TestFlight beta group | ⏳ |
| Apple Sign-In capability | ⏳ when OAuth enabled v1.1 |
| Push notifications APNs cert | ⏳ for FCM |

## Block 4 — Google Play Developer ($25 one-time, when Android ships)

| Item | Status |
|---|---|
| Google Play Console account | ⏳ |
| App record + bundle ID | ⏳ |
| FCM Server Key | ⏳ |
| Internal testing track | ⏳ |

## Block 5 — Store assets

### App icon (both stores)
- 1024×1024 PNG, no transparency, no rounded corners (Apple rounds for you).
- Source: `apps/mobile/assets/brand/` should contain `icon-1024.png`. Verify.

### iPhone screenshots (App Store)
Required sizes:
- **6.7" (iPhone 15/16/17 Pro Max):** 1290×2796 px, 3–10 images
- **6.5" (iPhone 11 Pro Max / XS Max):** 1242×2688 px, 3–10 images
- **5.5" (iPhone 8 Plus):** 1242×2208 px, 3–10 images (legacy fallback)

Suggested sequence:
1. Welcome / brand hero — "Made for those who keep the faith"
2. Today screen with one card visible
3. Profile detail with Begin / Pass buttons
4. Verse-anchored thread
5. Conversations inbox
6. Holy Code excerpt
7. Empty Today ("come back tomorrow at sunrise")

Generation path: build via Xcode → run on iPhone simulator at the right device size → screenshot via simulator's screenshot button → export to `docs/launch/screenshots/iphone/`.

### iPad screenshots
Optional at v1. Skip until iPad demand confirmed.

### Android screenshots (Play Store)
- **Phone:** 1080×1920 px or larger, 2–8 images
- **7" tablet:** 1024×1600 px (optional)
- **10" tablet:** 1440×2560 px (optional)

### Promotional graphic (Play Store only)
- 1024×500 px feature image. Cathedral Light hero scene with serif wordmark.

## Block 6 — Listing copy

| Field | Limit | Status |
|---|---|---|
| App name | 30 chars | "BlessCupid" |
| Subtitle (Apple) | 30 chars | "Faith-first Christian dating" |
| Short description (Google) | 80 chars | "Slow, dignified Christian dating built around scripture and covenant." |
| Description | 4000 chars | ⏳ DRAFT NEEDED |
| Keywords (Apple) | 100 chars | "christian, dating, faith, marriage, catholic, protestant, indonesia, bali" |
| Promotional text (Apple) | 170 chars | ⏳ DRAFT NEEDED |
| Support URL | — | https://blesscupid.com/support |
| Marketing URL | — | https://blesscupid.com |
| Age rating | — | 17+ (dating + user-generated content) |
| Category | — | Lifestyle / Social Networking |

### Suggested 4000-char description (DRAFT)

> BlessCupid is a faith-first dating app for committed Christians who want a slow, dignified path from match to covenant. Not a swipe casino. Not a hookup app.
>
> Three introductions a day. A shared verse. Conversations anchored on scripture. Every photo face-verified. Every first message moderated. Every thread held to the Holy Code of Conduct.
>
> What makes BlessCupid different:
> • DAILY BATCH — not infinite swipe. We send three thoughtful introductions in the morning. Read them, decide one, close the app. The phone is not a slot machine.
> • VERSE ANCHOR — your conversations begin with scripture, not "hi". We provide today's verse and Pastor-curated prompts so you never face cold-start awkwardness.
> • PRIVACY FIRST — your nickname is what others see. Your legal name stays private and is only used by our safety team for reports. We never share your email, phone, or precise location.
> • PASTOR-MODERATED — automated text moderation plus a 24-hour human review SLA. Two-strike system. Zero tolerance for sexual content, harassment, or hookup framing.
> • CROSS-TRADITION — Catholic, Protestant, Pentecostal, Reformed, Orthodox, all welcome. We honor where you are in your walk: lifelong, came later, returning, exploring.
>
> Built in Bali. Pastor-led. For Christians worldwide who are tired of nightclub-energy dating apps and ready for the morning-light kind.
>
> Subscriptions are optional. The full BlessCupid experience runs on the free tier. Bless+ adds priority introductions for those who want it.
>
> By creating an account you accept our Holy Code of Conduct: no sexual content, no harassment, no false identity, no off-platform pressure. We mean it. Read it: blesscupid.com/holy-code

## Block 7 — Apple Data Safety form

| Question | Answer |
|---|---|
| Does the app collect data? | Yes |
| Identifiers (User ID) | Yes — used for app functionality + analytics |
| Identifiers (Device ID) | Yes — used for push notifications |
| Contact info (Email) | Yes — used for app functionality |
| Contact info (Name) | Yes — used for app functionality (legal name private, nickname public) |
| Contact info (Phone) | Optional, only if user adds for verification |
| Health & fitness | No |
| Financial info | Yes — payment info via Xendit, used for app functionality |
| Location | Coarse only (city), used for matching |
| Sensitive info (sexual orientation) | No (we don't store it as match preference) |
| Contacts | No |
| User content (photos, audio, messages) | Yes — used for app functionality |
| Search history | No |
| Browsing history | No |
| Diagnostics (crash data) | Yes — used for analytics |
| Other data | No |

Linked to user identity: yes (matching requires it). Tracking: no. Third parties: PostHog, Sentry, Cloudflare R2, AWS Rekognition, Google Gemini, Xendit, Apple/Google sign-in.

## Block 8 — Pre-launch operational

| Item | Status |
|---|---|
| support@blesscupid.com email forwarder | ⏳ MX setup |
| privacy@blesscupid.com email forwarder | ⏳ MX setup |
| abuse@blesscupid.com email forwarder | ⏳ MX setup |
| Pastor + Julian on-call rotation | ⏳ schedule |
| Moderation queue staffing playbook | ⏳ docs/deploy/ |
| Incident response runbook | ⏳ docs/deploy/ |
| Backup restore test | ⏳ run once before launch |

## Block 9 — Beta launch sequence (week 6 gate per eng review)

1. ✅ Lane A-G code shipped (D blocked on Firebase creds)
2. ⏳ Pastor delivers final UX copy (blanket approval covers v1 baseline)
3. ⏳ Privacy Policy + Terms live on blesscupid.com
4. ⏳ Apple Developer paid + TestFlight upload
5. ⏳ Internal QA: Maestro flows pass + manual on Julian's iPhone
6. ⏳ 5 parish single-group leaders confirmed (Bali)
7. ⏳ 20 men + 20 women invitations sent
8. ⏳ TestFlight invite codes distributed
9. ⏳ 48h PostHog funnel + Sentry monitor
10. ⏳ D7 retention ≥ 40% gate; if pass → public submission

## Block 10 — Public launch (Apr 2026)

1. Beta D7 retention ≥ 40% (success criteria from eng review)
2. App Store + Play Store submission (~7-day Apple review)
3. Press kit on blesscupid.com/press
4. Bahasa Indonesia translations live
5. Parish-leader expansion: PH + SG cohorts (P3 v1.1)
6. Apple Search Ads + Meta Ads only if D7 holds
