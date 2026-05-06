# Maestro E2E flows

Per BLE eng-review 2026-05-06 (Lane G). Maestro picked over Detox for v1
beta gate. Flows here cover the 7 critical paths from the test plan in
`~/.gstack/projects/blesscupid/julian-development-eng-review-test-plan-*.md`.

## Run a flow

```bash
brew install maestro    # one-time
# Boot iOS simulator (Simulator.app shows iPhone 17 by default)
maestro test apps/mobile/.maestro/onboarding-happy.yaml
```

Set `BLE_TEST_EMAIL` + `BLE_TEST_PASSWORD` before running flows that
sign in. The bali-cohort beta uses `beta+<n>@blesscupid.com` test
accounts seeded by the API admin endpoint.

## Flow inventory

| File | Path |
|---|---|
| `onboarding-happy.yaml` | Welcome → Begin → Email signup → AgeGate → Covenant → Faith → ProfileBasics → FirstPhoto skip → Bio → Done → AppShell |
| `onboarding-reinstall.yaml` | Reinstall app, /me hydrate, lands on AppShell (regression for the loop fix on 2026-05-06) |
| `today-decision.yaml` | Today swipe-cards visible, tap Pass → next, tap Like → Conversations.Pending, tap Favorite once → button disables |
| `profile-detail.yaml` | Tap card → ProfileDetail, tap Begin → Thread opens with verse anchor |
| `thread-send.yaml` | Type + send a verse-anchored message, see it appear in stream |
| `bio-rejection.yaml` | Bio with banned phrase blocked, user can revise |
| `photo-skip.yaml` | Skip photo at FirstPhoto, advance to Bio (face-detect disabled v1) |
