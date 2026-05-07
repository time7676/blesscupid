/**
 * BLE-10 moderation-action test — SKIPPED for v1-restart.
 *
 * The original test exercised `ReportsService.applyModerationAction` against
 * a `ModerationAction` table that no longer exists. v1-restart collapses the
 * action log into the `Report` row itself (`reviewerUserId`, `reviewedAt`,
 * `resolution`). The new entry-point is `ReportsService.resolve`.
 *
 * TODO(BLE-???): rewrite against ReportsService.resolve():
 *   - dismiss → status='resolved', no isSuspended change
 *   - warn → status='resolved', no isSuspended change
 *   - suspend7d/ban → status='resolved' AND User.isSuspended=true
 *   - cannot resolve a closed report (BadRequestException)
 *   - missing report → NotFoundException
 */
import { describe, it } from 'vitest';

describe.skip('ReportsService.applyModerationAction (legacy)', () => {
  it('rewrite against ReportsService.resolve', () => {
    // Intentionally empty. See file header.
  });
});
