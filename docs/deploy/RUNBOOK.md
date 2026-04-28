# Ship Runbook — BlessCupid

> Audience: Founding Engineer + future on-call. Goal: take the app from `main` to TestFlight + production API in under 30 minutes.

## 0. One-time setup

### Tools

```bash
brew install flyctl
pnpm dlx eas-cli@latest --version    # bootstraps eas-cli
brew install --cask sentry-cli       # for source-map upload (optional)
```

### Accounts + credentials

- **Fly.io** — `fly auth login`. Create app once: `fly launch --no-deploy --copy-config --config apps/api/fly.toml`.
- **Expo** — `eas login`. Project linked via `apps/mobile/app.json` slug.
- **Apple Developer** — paid program enrolled. EAS submit needs an App Store Connect API key; configure with `eas credentials`.
- **Google Play** — service-account JSON for the internal track; configure with `eas credentials`.
- **Sentry** — two projects: `blesscupid-api` (Node) and `blesscupid-mobile` (React Native).
- **PostHog** — one project; same project key for api + mobile is fine since events are namespaced.

### Install observability SDKs (one-time, before first deploy)

The wrappers in `apps/api/src/observability/*` and `apps/mobile/src/lib/observability/*` lazy-import the SDKs so the app builds without them. Before the first real deploy, install:

```bash
pnpm --filter @blesscupid/api add @sentry/node posthog-node
pnpm --filter @blesscupid/mobile add @sentry/react-native posthog-react-native
git add pnpm-lock.yaml apps/*/package.json
git commit -m "chore(BLE-11): install Sentry + PostHog SDKs"
```

CI's frozen install requires the lockfile to be committed in the same PR.

### Fly secrets (set once, rotate as needed)

```bash
fly secrets set --app blesscupid-api \
  DATABASE_URL='postgres://...' \
  JWT_SECRET='...' \
  REFRESH_SECRET='...' \
  OPENAI_API_KEY='sk-...' \
  AWS_ACCESS_KEY_ID='...' \
  AWS_SECRET_ACCESS_KEY='...' \
  AWS_REGION='ap-southeast-1' \
  S3_BUCKET='blesscupid-photos' \
  SENTRY_DSN='https://...@sentry.io/...' \
  POSTHOG_API_KEY='phc_...' \
  POSTHOG_HOST='https://us.i.posthog.com' \
  GIT_SHA="$(git rev-parse --short HEAD)"
```

### Mobile env (set in EAS, not committed)

```bash
eas env:create --environment production EXPO_PUBLIC_API_URL https://blesscupid-api.fly.dev
eas env:create --environment production EXPO_PUBLIC_SENTRY_DSN https://...@sentry.io/...
eas env:create --environment production EXPO_PUBLIC_POSTHOG_KEY phc_...
eas env:create --environment production EXPO_PUBLIC_POSTHOG_HOST https://us.i.posthog.com
eas env:create --environment production EXPO_PUBLIC_ENV production
```

## 1. Backend deploy

```bash
./scripts/deploy-api.sh
```

The script:

1. Verifies `flyctl` is installed.
2. Refuses dirty working trees (`ALLOW_DIRTY=1` to override).
3. Verifies required secrets exist on the Fly app.
4. Runs `fly deploy --remote-only --strategy rolling`.

After deploy:

```bash
curl https://blesscupid-api.fly.dev/healthz
# -> { ok: true, service: "blesscupid-api", version: "..." }

fly logs --app blesscupid-api | head -100
```

## 2. Mobile build (TestFlight + Play internal)

```bash
./scripts/build-mobile.sh                     # both platforms, production, auto-submit
PLATFORM=ios ./scripts/build-mobile.sh        # iOS only
SUBMIT=0 ./scripts/build-mobile.sh            # build but skip submit
```

After the build finishes:

- iOS — App Store Connect → My Apps → BlessCupid → TestFlight → add CEO + Pastor by email under "Internal Testing". They get a TestFlight invite, install via the TestFlight app.
- Android — Play Console → BlessCupid → Testing → Internal testing → add testers list, share opt-in link.

## 3. Verify observability

After the first deploy with secrets set:

```bash
# Trigger a synthetic 500 to prove Sentry is wired:
curl -X POST https://blesscupid-api.fly.dev/__sentry-test__   # only available when SENTRY_DEBUG=1
# -> 500. Sentry → blesscupid-api → Issues should show the event within 30s.

# PostHog: open the app on a test device. PostHog → Activity should show
# `app_opened` and `screen_viewed` events within ~30s of opening.
```

## 4. Roll back

Backend:

```bash
fly releases --app blesscupid-api
fly deploy --image registry.fly.io/blesscupid-api:<previous-tag> --app blesscupid-api
```

Mobile (OTA only — JS-only fixes):

```bash
cd apps/mobile && eas update --branch production --message "rollback to <sha>"
```

For native rollbacks, re-promote a previous TestFlight build in App Store Connect.

## 5. CI deploy (optional, follow-up)

A GitHub Actions workflow that runs `./scripts/deploy-api.sh` on push to `main` after tests pass is the natural follow-up — tracked separately so this issue can ship without depending on Actions secrets being available.
