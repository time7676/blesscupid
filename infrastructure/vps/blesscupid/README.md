# BlessCupid VPS deploy (xserver-vps · 162.43.39.237)

App stack on the existing xserver multi-tenant VPS. Reuses the shared Postgres
(15) + Caddy proxy in `/srv/_shared/`. This dir holds BlessCupid-only services:
API container, Redis, Uptime Kuma, nightly DB backup → R2.

## Topology

```
[mobile / web]
      ↓ TLS
   Caddy  (shared, /srv/_shared/)
      ↓ proxy network
  blesscupid-api:3000  ── internal network ──  shared postgres:5432
                                            \─ blesscupid-redis:6379
                                            
   uptime-kuma:3001     ← reverse-proxied at status.blesscupid.com
```

## First-time deploy

```bash
ssh xserver-vps
sudo mkdir -p /srv/blesscupid && sudo chown $USER /srv/blesscupid
cd /srv/blesscupid
git clone https://github.com/time7676/blesscupid.git .
git checkout development

# Copy + fill secrets (mode 600)
cp infrastructure/vps/blesscupid/.env.example .env
chmod 600 .env
nano .env  # fill JWT secrets, R2 keys, Firebase JSON, Postgres password

# Create blesscupid DB role + database in shared Postgres (one-time)
docker exec -it postgres psql -U postgres <<'SQL'
CREATE ROLE blesscupid WITH LOGIN PASSWORD '<value of POSTGRES_BLESSCUPID_PASSWORD>';
CREATE DATABASE blesscupid OWNER blesscupid;
SQL

# Bring up the stack
cd infrastructure/vps/blesscupid
ln -sf $(pwd)/.env ./.env  # if symlinking from /srv/blesscupid/.env
docker compose up -d --build

# Run migrations
docker exec blesscupid-api pnpm -F @blesscupid/api prisma migrate deploy

# Health check
curl http://localhost:3000/healthz
```

## Caddy site (already in repo at `infrastructure/vps/shared/caddy/sites/blesscupid.caddy`)

If not yet copied, deploy it:
```bash
sudo cp infrastructure/vps/shared/caddy/sites/blesscupid.caddy /srv/_shared/caddy/sites/
docker exec caddy caddy reload --config /etc/caddy/Caddyfile
```

For Uptime Kuma, append:
```caddy
status.blesscupid.com {
  reverse_proxy blesscupid-uptime:3001
}
```

## Backups (nightly 03:30 UTC → R2 `blesscupid-backups`)

```bash
sudo cp infrastructure/vps/blesscupid/backup.sh /srv/blesscupid/backup.sh
sudo chmod +x /srv/blesscupid/backup.sh

sudo cp infrastructure/vps/blesscupid/blesscupid-backup.{service,timer} /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now blesscupid-backup.timer

# Verify schedule
systemctl list-timers blesscupid-backup.timer
```

Prereqs: `aws-cli` installed (`apt install awscli` or `pip install awscli`).
R2 lifecycle rule for 30-day retention must be set ONCE in Cloudflare
dashboard → R2 → blesscupid-backups → Settings → Object Lifecycle Rules.

## Updates

```bash
cd /srv/blesscupid
git pull
cd infrastructure/vps/blesscupid
docker compose up -d --build api
docker exec blesscupid-api pnpm -F @blesscupid/api prisma migrate deploy
```

## Rollback

```bash
cd /srv/blesscupid && git log --oneline -5
git checkout <prior-sha>
cd infrastructure/vps/blesscupid && docker compose up -d --build api
```

DB rollback: download yesterday's dump from R2 and `gunzip | docker exec -i postgres psql -U blesscupid blesscupid`.

## Resource budget

| Service | RAM cap | CPU cap |
|---|---|---|
| blesscupid-api | 768M | 1.0 |
| blesscupid-redis | 128M | 0.5 |
| blesscupid-uptime | 256M | 0.5 |
| (shared) postgres | 512M | 1.0 |
| (shared) caddy | ~50M | low |

Total BlessCupid overhead: ~1.2 GB RAM. Confirm xserver-vps has headroom
before deploy: `free -h`.

## Notes

- **Don't break shared infra.** Other tenants on this VPS: cocon-lab.com,
  passkuru.cocon-lab.com, kebahagiaan.corone.monster, blesscupid.com (teaser).
- **Don't bump shared Postgres to 16** without coordinating cross-tenant.
  PG15 → PG16 is a separate migration project (pg_upgrade or dump-and-load).
- **R2 free tier**: 10 GB total + 1M Class A ops + 10M Class B ops/mo.
  Both BlessCupid buckets share this. Lifecycle rules essential.
