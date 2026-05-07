/**
 * BLE-63 reports-routing test — SKIPPED for v1-restart.
 *
 * The original test asserted routing into `category` / `queue` columns and
 * `EvidenceFreeze` rows, plus a `canAccessQueue` ACL helper. None of that
 * survives the v1-restart schema (no category/queue, no EvidenceFreeze, no
 * routing module). Reports are now plain `Report` rows with `status` and
 * optional `resolution` — see reports.service.ts.
 *
 * TODO(BLE-???): rewrite test against the v1-restart Report API:
 *   - cannot_report_self
 *   - autoBlock writes Block rows both directions
 *   - resolve('suspend7d'|'ban') flips User.isSuspended
 */
import { describe, it } from 'vitest';

describe.skip('BLE-63 routing — abuse/minor → ceo_p0 (legacy v0 schema)', () => {
  it('rewrite for v1-restart', () => {
    // Intentionally empty. See file header.
  });
});
