# Mobile Store Credentials Setup (BLE-122)

> One-time founder/owner setup. EAS submit + build go non-interactive after this is done.

## Status

**Blocked on human-only actions.** An agent cannot pay for accounts, generate API keys in vendor consoles, or run interactive `eas credentials`. Owner: founder.

## Prerequisites

| Requirement | Cost | Where |
|---|---|---|
| Apple Developer Program | $99/yr | https://developer.apple.com/programs/enroll/ |
| Google Play Console | $25 one-time | https://play.google.com/console/signup |
| App Store Connect API key (Admin role) | free, after Apple enrolled | App Store Connect → Users and Access → Integrations → App Store Connect API |
| Play service-account JSON (Release Manager) | free, after Play enrolled | Play Console → Setup → API access → link a Google Cloud project → create service account → grant Release Manager → download JSON |
| Expo + EAS account | free | https://expo.dev |

## App identifiers (already in `apps/mobile/app.json`)

- iOS bundle: `com.blesscupid.app`
- Android package: `com.blesscupid.app`
- Expo slug: `blesscupid`

Both store listings must use these exact IDs.

## 1. Create the apps in each store (manual)

### Apple — App Store Connect

1. Sign in with the Apple Developer account.
2. App Store Connect → My Apps → `+` → New App.
3. Platform: iOS. Name: `BlessCupid`. Primary language: English (U.S.). Bundle ID: `com.blesscupid.app` (must already exist under Certificates, Identifiers & Profiles → Identifiers).
4. SKU: `blesscupid-ios-001`. User access: Full Access.

### Google — Play Console

1. Sign in with the Play Console account.
2. Create app. Default language: English (United States). App name: `BlessCupid`. App or game: App. Free/paid: Free.
3. Set the package name to `com.blesscupid.app` on the first internal upload (Play locks the package name from the first APK/AAB).

## 2. Generate the API credentials

### Apple — App Store Connect API key

1. App Store Connect → Users and Access → Integrations → App Store Connect API → Keys → `Generate API Key`.
2. Name: `eas-submit`. Access: `Admin`.
3. Download the `.p8` file **once** (Apple will not let you re-download). Note the Key ID and Issuer ID on the same screen.
4. Stash the `.p8` in 1Password (or equivalent), and copy a working file to `apps/mobile/credentials/asc-api-key.p8` (gitignored).

### Google — Play service-account JSON

1. Play Console → Setup → API access.
2. Link a Google Cloud project if not already linked.
3. Create a service account in the linked GCP project. Role: none at the GCP level is required.
4. Back in Play Console → API access → grant the new service account access to this app with permission `Release Manager` (under app permissions).
5. In Google Cloud Console → IAM & Admin → Service Accounts → the new SA → Keys → Add Key → JSON. Download.
6. Stash the JSON in 1Password and copy a working file to `apps/mobile/credentials/play-service-account.json` (gitignored).

## 3. Configure EAS

```bash
cd apps/mobile

# Sign in (uses EXPO_TOKEN if set, otherwise interactive).
eas login

# iOS — uploads the .p8 to EAS, links it to the project.
eas credentials  # platform: ios → production
#   - "Use existing certificate" → no
#   - "Set up Apple Distribution Certificate" → yes (EAS generates / fetches)
#   - "Set up Provisioning Profile" → yes (EAS generates / fetches)
#   - "App Store Connect API Key" → upload ./credentials/asc-api-key.p8 (used by `eas submit`)

# Android — uploads the service-account JSON, links it.
eas credentials  # platform: android → production
#   - "Set up a Google Service Account Key for Play Store submissions" → yes
#   - upload ./credentials/play-service-account.json
```

After upload, EAS stores both centrally — local `apps/mobile/credentials/` becomes optional. Keep the local copies for disaster-recovery + CI later.

## 4. Set the iOS submit env vars

`apps/mobile/eas.json` references three env vars on the iOS submit profile (App Store Connect needs them even when EAS holds the .p8):

```bash
eas env:create --environment production ASC_APP_ID '<App Store Connect numeric app ID>'
eas env:create --environment production APPLE_ID 'founder@blesscupid.com'
eas env:create --environment production ASC_API_KEY_ID '<10-char Key ID>'
eas env:create --environment production ASC_API_KEY_ISSUER_ID '<UUID Issuer ID>'
```

`ASC_APP_ID` is in App Store Connect → My Apps → BlessCupid → App Information → Apple ID (numeric).

## 5. Verify acceptance

```bash
cd apps/mobile

# Build — should NOT prompt for credentials.
eas build --profile production --platform all --non-interactive

# Submit latest build to TestFlight + Play Internal track.
eas submit --profile production --platform all --latest
```

Both must succeed end-to-end with no interactive prompts. That is the BLE-122 acceptance bar.

## Failure modes seen in practice

- `eas submit` for iOS asks for the App Store Connect API key → re-run step 3 iOS, the key was uploaded against a stale project.
- Play upload: `The Android App Bundle was signed with the wrong key` → first time only; first upload to a fresh Play app must use the same upload key as future builds. Let EAS generate it (default), and never reset it.
- Play service-account JSON: `Permission denied` → the service account was created but never granted `Release Manager` inside the Play Console (step 2.B.4). The GCP IAM role is not the same as the Play Console role.

## Rotation

- Apple .p8: revoke in App Store Connect → Integrations → Keys, generate a new one, repeat step 3 iOS.
- Play service-account JSON: rotate the key in Cloud Console → Service Account → Keys, repeat step 3 Android. Old JSON keeps working until revoked.

## Why this issue stays open until founder unblocks

The agent cannot:

- Pay for Apple or Play accounts.
- Click through Apple ID 2FA / phone verification.
- Sign Apple's paid-developer agreement.
- Create the App Store Connect API key (no credentials, no UI access).
- Create the Play service-account in the founder's GCP project.

What the agent did do (durable in repo):

- Hardened `apps/mobile/eas.json` with explicit submit profiles for iOS + Android.
- Reserved `apps/mobile/credentials/` and added it to `.gitignore` alongside `*.p8` so accidental commits of secrets are blocked.
- Wrote this runbook so the unblock path is one read away.
