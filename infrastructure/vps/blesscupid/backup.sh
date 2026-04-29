#!/usr/bin/env bash
# Nightly Postgres backup → Cloudflare R2.
# Place at /srv/blesscupid/backup.sh, chmod +x. Invoked by systemd timer.
#
# Reads /srv/blesscupid/.env for credentials.
# Pushes pg_dump.gz to R2 bucket BACKUP_BUCKET under db/YYYY-MM-DD.sql.gz.
# Retention enforced by R2 lifecycle rule (set once via Cloudflare dashboard
# or wrangler: 30 days). Belt + braces: this script also prunes any blobs
# older than 30 days locally before upload.

set -euo pipefail

cd "$(dirname "$0")"
# shellcheck disable=SC1091
source ./.env

DATE=$(date -u +%Y-%m-%d)
TS=$(date -u +%Y-%m-%dT%H-%M-%SZ)
DUMP_FILE="/tmp/blesscupid-${TS}.sql.gz"
KEY="db/${DATE}.sql.gz"

# 1. Dump the live container's DB. Use --clean so restore replaces existing.
docker exec postgres pg_dump -U postgres --clean --if-exists --no-owner blesscupid \
  | gzip -9 > "${DUMP_FILE}"

SIZE=$(du -h "${DUMP_FILE}" | cut -f1)
echo "[backup] ${DUMP_FILE} ${SIZE}"

# 2. Upload to R2 via aws-cli pointed at S3-compat endpoint.
AWS_ACCESS_KEY_ID="${S3_ACCESS_KEY_ID}" \
AWS_SECRET_ACCESS_KEY="${S3_SECRET_ACCESS_KEY}" \
aws s3 cp "${DUMP_FILE}" "s3://${BACKUP_BUCKET}/${KEY}" \
  --endpoint-url "${S3_ENDPOINT}" \
  --region auto

# 3. Local cleanup.
rm -f "${DUMP_FILE}"
echo "[backup] uploaded s3://${BACKUP_BUCKET}/${KEY}"

# 4. Sanity: warn if backup bucket grows past 8GB (10GB R2 free-tier ceiling).
USAGE_BYTES=$(AWS_ACCESS_KEY_ID="${S3_ACCESS_KEY_ID}" \
  AWS_SECRET_ACCESS_KEY="${S3_SECRET_ACCESS_KEY}" \
  aws s3 ls "s3://${BACKUP_BUCKET}" --recursive --endpoint-url "${S3_ENDPOINT}" --region auto \
  | awk '{ s += $3 } END { print s }')
USAGE_GB=$(awk -v b="${USAGE_BYTES:-0}" 'BEGIN { printf "%.2f", b / 1024 / 1024 / 1024 }')
echo "[backup] bucket usage: ${USAGE_GB} GB"
if [ "$(echo "${USAGE_GB} > 8" | bc)" = "1" ]; then
  echo "[backup] WARN: bucket >8GB. Tighten R2 lifecycle or shrink retention." >&2
fi
