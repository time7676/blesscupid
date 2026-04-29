-- BLE-131 — partial unique index enforcing 1:1 active pastor-mode on the
-- audited side. Postgres-only feature; not expressible in Prisma schema
-- language as of Prisma 5.x.
--
-- Run after `prisma db push` (or via the deploy script):
--   pnpm --filter @blesscupid/api exec prisma db execute \
--     --file apps/api/prisma/sql/0001_pastor_mode_relationship_partial_unique.sql \
--     --schema apps/api/prisma/schema.prisma
--
-- Idempotent — IF NOT EXISTS guards re-runs.

CREATE UNIQUE INDEX IF NOT EXISTS pastor_mode_relationship_one_active_per_audited
  ON "PastorModeRelationship" ("auditedUserId")
  WHERE status = 'active';
