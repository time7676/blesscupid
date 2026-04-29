# BlessCupid Launch Checklist

## Decisions applied 2026-04-29
- Pastor copy approved by product owner. No further Pastor review needed.
- OpenAI replaced with rule-based text moderation (see services/moderation/src/textClassifier.ts).
- Apple/Google Developer accounts deferred to TestFlight stage.
- Free tier only for all external services.
- Verse-of-day auto-generated from JSON (daily cron, see services/verse-of-day/).

## 1. Domain + DNS (5 min) ✅ DONE

- [ ] Point `api.blesscupid.com` A-record to VPS IP: `162.43.39.237`
- [ ] Optional: point `blesscupid.com` to landing page (Vercel/Netlify/Cloudflare Pages)

After DNS propagates (~5 min):
```bash
ssh xserver-vps
ln -s /etc/nginx/sites-available/blesscupid /etc/nginx/sites-enabled/blesscupid
nginx -t && systemctl reload nginx
certbot --nginx -d api.blesscupid.com
```

## 2. Apple Developer Account ($99/yr) — DEFERRED until TestFlight stage

- [ ] Enroll at https://developer.apple.com/programs/enroll/
- [ ] Create App ID: `com.blesscupid.app`
- [ ] Enable "Sign in with Apple" capability
- [ ] Create App Store Connect entry for BlessCupid
- [ ] Generate ASC API key (App Store Connect API) for EAS submit:
  - https://appstoreconnect.apple.com/access/api
  - Download `.p8` key
  - Save to `apps/mobile/credentials/asc-api-key.p8`
  - Note: Key ID + Issuer ID for `eas.json`

## 3. GitHub Repository ✅ DONE

Remote: `https://github.com/time7676/blesscupid.git`
- [x] Repo exists
- [x] Remote configured
- [ ] Push current branch
- [ ] Set Actions secrets (see §4)
```bash
cd /path/to/ble-development
git remote add origin https://github.com/<your-username>/blesscupid.git
git push -u origin development
```

## 4. GitHub Actions Secrets (VPS auto-deploy)

In GitHub repo → Settings → Secrets and variables → Actions → New repository secret:

| Secret | Value |
|--------|-------|
| `VPS_HOST` | `162.43.39.237` |
| `VPS_USER` | `root` (or your SSH user) |
| `VPS_SSH_KEY` | Your local SSH private key (`cat ~/.ssh/id_rsa` or the key for `xserver-vps`) |

## 5. Firebase Project (Phone Auth — Free tier: 10k verifications/mo) 🔄 IN PROGRESS

Account: `j_loh@cocon-inc.co.jp` via Google Auth
- [ ] Run `firebase login` locally (user will authenticate in browser)
- [ ] Create/select project in console: https://console.firebase.google.com/
- [ ] Enable "Phone" authentication method
- [ ] Download service account key:
  - Project settings → Service accounts → Generate new private key
- [ ] Base64-encode the JSON:
```bash
cat service-account.json | base64
```
- [ ] Paste into VPS: `/srv/blesscupid/.env` as `FIREBASE_ADMIN_CREDENTIALS_JSON`

## 6. AWS Account (Rekognition — Free tier: 5k face comparisons/mo for 12mo) 🔄 IN PROGRESS

- [ ] Create IAM user with policy:
  - `AmazonRekognitionFullAccess`
  - `AmazonS3FullAccess` (if using S3 instead of R2)
- [ ] Get Access Key ID + Secret Access Key
- [ ] Paste into `/srv/blesscupid/.env`

## 7. Cloudflare R2 (Image storage — Free tier: 10GB + 1M ops/mo) 🔄 IN PROGRESS

- [ ] Install Wrangler CLI: `npm install -g wrangler`
- [ ] Run `wrangler login`
- [ ] Create bucket: `wrangler r2 bucket create blesscupid-photos-dev`
- [ ] Generate S3-compatible API token at https://dash.cloudflare.com/ → R2 → Manage R2 API Tokens
- [ ] Paste endpoint + keys into `/srv/blesscupid/.env`

Alternative: use AWS S3 (same creds as Rekognition).

## 8. OpenAI (Text moderation) ❌ REMOVED

Replaced with rule-based engine in `services/moderation/src/textClassifier.ts`. Zero cost, deterministic, no API key.

## 9. Sentry + PostHog (Error tracking + analytics — Both free tier) ⬜ TODO

- [ ] Sentry: create project, copy DSN → `SENTRY_DSN`
- [ ] PostHog: create project, copy API key → `POSTHOG_API_KEY` (mobile)

## 10. First Deploy to VPS

```bash
ssh xserver-vps

cd /srv/blesscupid
git clone https://github.com/<your-username>/blesscupid.git .
git checkout development

# Fill in all secrets in .env
cp .env.example .env
nano .env

docker-compose up -d --build
```

Verify:
```bash
curl http://localhost:3000/healthz
docker logs -f blesscupid-api
```

## 11. iOS TestFlight Build

```bash
cd apps/mobile
# Fill in eas.json env vars:
# ASC_APP_ID, APPLE_ID, ASC_API_KEY_ID, ASC_API_KEY_ISSUER_ID

pnpm eas build --platform ios --profile preview
# then submit to TestFlight:
pnpm eas submit --platform ios
```

## 12. KYC Admin Review

After a user submits KYC:
```bash
# Query pending queue (as admin/authed user)
curl -H "Authorization: Bearer <token>" https://api.blesscupid.com/kyc/admin/queue

# Approve/reject
PATCH https://api.blesscupid.com/kyc/admin/review/<kyc-id>
{ "status": "approved" }
```

## 13. Beta Testing → National Launch

See `ROADMAP.md` for the 8-phase plan.

---

**Current VPS status:**
- ✅ Ubuntu 25.04, Docker 28.2.2
- ✅ Postgres container running (shared)
- ✅ Nginx config ready for `api.blesscupid.com`
- ✅ `/srv/blesscupid/.env` created (fill in secrets)
- ⬜ DNS pointing needed
- ⬜ SSL certificate (Certbot) needs DNS first
