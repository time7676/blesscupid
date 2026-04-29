// BLE-136 — pastor-mode gate telemetry. Aggregate-only counters.
//
// Hard rule: NO PII (no userId, no IP, no DOB, no NIK). The admin tile
// reads two integers — pass count and neutral-fail count over a window.
// We back this with an in-memory counter for v1; once we wire the broader
// observability stack (PostHog/Sentry per stack note), this layer becomes
// the single emit point.
//
// The counts are also derivable from `PastorModeGateAttempt` (which is
// userId-bound). Admin dashboard SHOULD prefer the aggregate query so
// the surface never holds a list of users tied to gate outcomes.

import { Injectable, Logger } from '@nestjs/common';
import { PASTOR_MODE_GATE_TELEMETRY_EVENTS } from '@blesscupid/shared';
import { PrismaService } from '../prisma/prisma.service.js';

export const PASTOR_MODE_GATE_DECISION = {
  pass: PASTOR_MODE_GATE_TELEMETRY_EVENTS.decision_pass,
  neutral_fail: PASTOR_MODE_GATE_TELEMETRY_EVENTS.decision_neutral_fail,
} as const;

export type PastorModeGateDecisionEvent =
  (typeof PASTOR_MODE_GATE_DECISION)[keyof typeof PASTOR_MODE_GATE_DECISION];

@Injectable()
export class PastorModeGateTelemetry {
  private readonly log = new Logger('PastorModeGateTelemetry');
  private readonly counters = new Map<string, number>();

  constructor(private readonly prisma: PrismaService) {}

  emitDecision(event: PastorModeGateDecisionEvent): void {
    this.counters.set(event, (this.counters.get(event) ?? 0) + 1);
    this.log.log(`evt=${event}`);
  }

  inMemoryCounters(): Record<string, number> {
    return Object.fromEntries(this.counters.entries());
  }

  // Aggregate from the audit table over a window. NEVER returns user ids
  // or rows — only counts.
  async aggregate(windowMs = 7 * 24 * 60 * 60 * 1000): Promise<{
    windowMs: number;
    passCount: number;
    neutralFailCount: number;
    ktpAttempts: number;
    affidavitAttempts: number;
  }> {
    const since = new Date(Date.now() - windowMs);
    const [passCount, neutralFailCount, ktpAttempts, affidavitAttempts] = await Promise.all([
      this.prisma.pastorModeGateAttempt.count({
        where: { createdAt: { gte: since }, outcome: 'passed' },
      }),
      this.prisma.pastorModeGateAttempt.count({
        where: { createdAt: { gte: since }, outcome: 'neutral_fail' },
      }),
      this.prisma.pastorModeGateAttempt.count({
        where: { createdAt: { gte: since }, attestationKind: 'ktp' },
      }),
      this.prisma.pastorModeGateAttempt.count({
        where: { createdAt: { gte: since }, attestationKind: 'affidavit' },
      }),
    ]);
    return { windowMs, passCount, neutralFailCount, ktpAttempts, affidavitAttempts };
  }
}
