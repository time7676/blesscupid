# Deploy docs

- [`RUNBOOK.md`](./RUNBOOK.md) — main → TestFlight + production API
- [`ALERTS.md`](./ALERTS.md) — on-call alert rules + test cadence

## Quick reference

```bash
./scripts/deploy-api.sh            # backend → Fly.io
./scripts/build-mobile.sh          # iOS TestFlight + Android internal
```

Both scripts validate prerequisites and refuse to run with a dirty tree or missing secrets.
