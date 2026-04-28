# On-call Alerts — BlessCupid

> One on-call: the founding engineer. Page only on real, actionable signals. Alerts route to a single Telegram channel for v1; PagerDuty later.

## Alert sources

| Source | What it watches | Routes to |
|---|---|---|
| **Sentry** (`blesscupid-api` + `blesscupid-mobile`) | New issues, regressions, error rate spikes | Telegram `#blesscupid-alerts` via Sentry → Slack-compatible webhook |
| **Fly.io built-in** | Machine restarts, OOM, deploy failures | Email, Telegram via Fly metrics → Grafana Alertmanager |
| **PostHog** | Funnel anomalies (signup completion < 30%) | Email digest, daily |
| **UptimeRobot** | `/healthz` reachability + cert expiry | Telegram + email |

## Concrete alert rules

### 1. Backend 5xx rate

- **Source:** Sentry → Alerts → Issue Alerts → "API 5xx surge"
- **Trigger:** number of events in `http.status_code:>=500` exceeds `20 in 5 minutes`
- **Action:** notify Telegram `#blesscupid-alerts`
- **Test:** enable `SENTRY_DEBUG=1` env, hit `/__sentry-test__` in a loop for 5 minutes; alert should fire.

### 2. Moderation queue depth

- **Source:** custom Prometheus metric `moderation_review_queue_depth` exposed at `/metrics` (added under BLE-11 follow-up)
- **Trigger:** value > 50 for 10 consecutive minutes
- **Action:** Telegram `#blesscupid-alerts`, email Founding Engineer
- **Test:** insert 51 fake `MODERATION_REVIEW` rows in the staging DB, wait 10 minutes, verify alert fires; then delete fake rows.

### 3. Mobile crash-free sessions

- **Source:** Sentry Performance → Releases
- **Trigger:** crash-free sessions < 99% over 1h on any production release
- **Action:** Telegram + email

### 4. /healthz down

- **Source:** UptimeRobot
- **Endpoint:** `https://blesscupid-api.fly.dev/healthz`
- **Trigger:** 2 consecutive failures, 60s interval
- **Action:** Telegram + email

### 5. Cert expiry

- **Source:** UptimeRobot SSL monitor
- **Trigger:** < 14 days to expiry
- **Action:** email only (not paging)

## Test cadence

- **First deploy:** trigger each rule manually, confirm it fires, document time-to-alert in this file.
- **Monthly:** chaos drill — pick one rule at random, simulate the trigger, confirm alert and silence flow.

## Silence + ack flow

- All alerts include a "ack" link (Telegram bot) that snoozes the rule for 1h.
- After acking, file an issue under `BLE-OBS-*` with the alert payload and resolution.

## Acceptance for BLE-11

- Rule **#1 (5xx)** must be configured AND test-fired before beta launch.
- Rule **#2 (mod queue)** must be configured AND test-fired before beta launch.
- Rule **#4 (healthz)** must be live before TestFlight invites go out.

The remaining rules can lag into the first week of beta.
