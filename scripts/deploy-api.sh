#!/usr/bin/env bash
# One-command backend deploy to Fly.io.
#
# Usage:
#   ./scripts/deploy-api.sh            # deploys with current env / latest commit SHA
#   FLY_APP=blesscupid-api-staging ./scripts/deploy-api.sh
#
# Requires:
#   - flyctl on PATH (`brew install flyctl`)
#   - FLY_API_TOKEN in env, or `fly auth login` already run
#   - Secrets set on the Fly app: DATABASE_URL, JWT_SECRET, OPENAI_API_KEY,
#     AWS_*, SENTRY_DSN, POSTHOG_API_KEY  (see docs/deploy/RUNBOOK.md)

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

FLY_APP="${FLY_APP:-blesscupid-api}"
GIT_SHA="${GIT_SHA:-$(git rev-parse --short HEAD)}"

echo "[deploy] app=$FLY_APP sha=$GIT_SHA"

if ! command -v fly >/dev/null 2>&1; then
  echo "[deploy] flyctl not found. Install: brew install flyctl"
  exit 1
fi

# Sanity: working tree must be clean unless ALLOW_DIRTY=1.
if [ -z "${ALLOW_DIRTY:-}" ] && [ -n "$(git status --porcelain)" ]; then
  echo "[deploy] working tree dirty. Commit or set ALLOW_DIRTY=1."
  exit 1
fi

# Sanity: required secrets exist on the Fly app.
echo "[deploy] checking required secrets on $FLY_APP"
REQUIRED_SECRETS=(DATABASE_URL JWT_SECRET SENTRY_DSN POSTHOG_API_KEY)
SECRET_LIST="$(fly secrets list --app "$FLY_APP" --json 2>/dev/null || echo '[]')"
MISSING=()
for s in "${REQUIRED_SECRETS[@]}"; do
  if ! echo "$SECRET_LIST" | grep -q "\"Name\":\"$s\""; then
    MISSING+=("$s")
  fi
done
if [ "${#MISSING[@]}" -gt 0 ]; then
  echo "[deploy] missing secrets on $FLY_APP: ${MISSING[*]}"
  echo "[deploy] set them: fly secrets set <NAME>=<VALUE> --app $FLY_APP"
  exit 1
fi

# Deploy.
# Fly runs `prisma migrate deploy` as the release_command (apps/api/fly.toml
# [deploy] block) before promoting the new VMs. A failed migration aborts
# the deploy. See docs/deploy/RUNBOOK.md §1.5 for migration ops.
echo "[deploy] migrations will run via fly release_command (prisma migrate deploy)"
exec fly deploy \
  --app "$FLY_APP" \
  --config apps/api/fly.toml \
  --dockerfile apps/api/Dockerfile \
  --build-arg "GIT_SHA=$GIT_SHA" \
  --remote-only \
  --strategy rolling
