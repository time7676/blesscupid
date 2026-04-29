/**
 * BLE-136 acceptance: pastor-mode 18+ gate. Verifies:
 *   - All failure modes collapse to the same neutral-fail response (no leak).
 *   - 24h cooldown blocks retry without re-running OCR/affidavit logic.
 *   - Internal reasons are recorded on the audit table for ops, NEVER returned.
 *   - Pass writes status=passed and zero-PII telemetry counters bump.
 *   - Affidavit requires liveness selfie key.
 */
import { describe, it, expect } from 'vitest';
import {
  PASTOR_MODE_GATE_COOLDOWN_MS,
  PASTOR_MODE_NEUTRAL_FAIL_ID,
} from '@blesscupid/shared';
import { PastorModeGateService } from './pastor-mode-gate.service.js';
import {
  PASTOR_MODE_GATE_DECISION,
  PastorModeGateTelemetry,
} from './pastor-mode-gate.telemetry.js';

type GateRow = {
  userId: string;
  status: 'none' | 'passed' | 'neutral_fail';
  attestationKind: 'ktp' | 'affidavit' | null;
  passedAt: Date | null;
  decidedAt: Date | null;
  cooldownUntil: Date | null;
};

type AttemptRow = {
  userId: string;
  attestationKind: 'ktp' | 'affidavit';
  outcome: 'passed' | 'neutral_fail';
  internalReason: string | null;
  createdAt: Date;
};

class FakePrisma {
  gates = new Map<string, GateRow>();
  attempts: AttemptRow[] = [];

  pastorModeGate = {
    findUnique: async ({ where: { userId } }: { where: { userId: string } }) =>
      this.gates.get(userId) ?? null,
    upsert: async ({
      where,
      update,
      create,
    }: {
      where: { userId: string };
      update: Partial<GateRow>;
      create: Partial<GateRow> & { userId: string };
    }) => {
      const existing = this.gates.get(where.userId);
      const next: GateRow = existing
        ? {
            ...existing,
            ...update,
            attestationKind:
              update.attestationKind ?? existing.attestationKind,
            cooldownUntil:
              'cooldownUntil' in update ? update.cooldownUntil ?? null : existing.cooldownUntil,
          }
        : {
            userId: create.userId,
            status: create.status ?? 'none',
            attestationKind: create.attestationKind ?? null,
            passedAt: create.passedAt ?? null,
            decidedAt: create.decidedAt ?? null,
            cooldownUntil: create.cooldownUntil ?? null,
          };
      this.gates.set(where.userId, next);
      return next;
    },
  };

  pastorModeGateAttempt = {
    create: async ({ data }: { data: Omit<AttemptRow, 'createdAt'> }) => {
      const row: AttemptRow = { ...data, createdAt: new Date() };
      this.attempts.push(row);
      return row;
    },
    count: async () => 0,
  };
}

class StubTelemetry {
  events: string[] = [];
  emitDecision(event: string) {
    this.events.push(event);
  }
}

function makeService() {
  const prisma = new FakePrisma();
  const telemetry = new StubTelemetry();
  const svc = new PastorModeGateService(
    prisma as never,
    telemetry as unknown as PastorModeGateTelemetry,
  );
  return { svc, prisma, telemetry };
}

describe('PastorModeGateService — KTP path', () => {
  it('passes a 25-year-old', async () => {
    const { svc, prisma, telemetry } = makeService();
    const r = await svc.verifyKtp('user-1', { dobIso: '2000-04-29' });
    expect(r.passed).toBe(true);
    expect(r.passedAt).toBeTruthy();
    expect(prisma.gates.get('user-1')?.status).toBe('passed');
    expect(prisma.attempts[0]).toMatchObject({
      outcome: 'passed',
      attestationKind: 'ktp',
    });
    expect(telemetry.events).toEqual([PASTOR_MODE_GATE_DECISION.pass]);
  });

  it('rejects under-18 with neutral-fail and audits internal reason', async () => {
    const { svc, prisma } = makeService();
    const r = await svc.verifyKtp('user-2', { dobIso: '2010-04-29' });
    expect(r.passed).toBe(false);
    expect(r.messageId).toBe(PASTOR_MODE_NEUTRAL_FAIL_ID);
    // Critical: response NEVER contains the internal reason.
    expect(JSON.stringify(r)).not.toContain('underage');
    expect(prisma.attempts[0]?.internalReason).toBe('underage');
  });

  it('rejects low OCR confidence with neutral-fail (no leak)', async () => {
    const { svc, prisma } = makeService();
    const r = await svc.verifyKtp('user-3', {
      dobIso: '2000-04-29',
      ocrConfidence: 0.5,
    });
    expect(r.passed).toBe(false);
    expect(JSON.stringify(r)).not.toContain('ocr');
    expect(prisma.attempts[0]?.internalReason).toBe('ktp_ocr_low_confidence');
  });

  it('rejects malformed NIK with the SAME neutral-fail surface', async () => {
    const { svc } = makeService();
    const r = await svc.verifyKtp('user-4', { nik: '0000000000000000' });
    expect(r.passed).toBe(false);
    expect(r.messageId).toBe(PASTOR_MODE_NEUTRAL_FAIL_ID);
  });

  it('extracts DOB from a valid male NIK and passes', async () => {
    const { svc } = makeService();
    // 32 71 01 28 07 90 0001 — 1990-07-28 male
    const r = await svc.verifyKtp('user-5', { nik: '3271012807900001' });
    expect(r.passed).toBe(true);
  });
});

describe('PastorModeGateService — neutral-fail invariant', () => {
  it('three different failure modes return identical response shape', async () => {
    const { svc } = makeService();
    const a = await svc.verifyKtp('u-a', { dobIso: '2010-04-29' }); // underage
    const b = await svc.verifyKtp('u-b', { dobIso: '2099-04-29' }); // future_dob
    const c = await svc.verifyKtp('u-c', { dobIso: 'not-a-date' }); // invalid_dob

    // All three: same shape, same messageId, no extra fields.
    for (const r of [a, b, c]) {
      expect(r).toEqual({ passed: false, messageId: PASTOR_MODE_NEUTRAL_FAIL_ID });
    }
  });
});

describe('PastorModeGateService — 24h cooldown', () => {
  it('blocks retry within window without re-running decision logic', async () => {
    const { svc, prisma } = makeService();
    await svc.verifyKtp('user-c', { dobIso: '2010-04-29' });
    expect(prisma.attempts).toHaveLength(1);
    expect(prisma.attempts[0]?.internalReason).toBe('underage');

    // Same user, valid DOB this time. Cooldown still active → neutral-fail.
    const r2 = await svc.verifyKtp('user-c', { dobIso: '1990-04-29' });
    expect(r2.passed).toBe(false);
    expect(prisma.attempts).toHaveLength(2);
    expect(prisma.attempts[1]?.internalReason).toBe('cooldown_active');
  });

  it('cooldownUntil is now + 24h on neutral-fail', async () => {
    const { svc, prisma } = makeService();
    const before = Date.now();
    await svc.verifyKtp('user-d', { dobIso: '2010-04-29' });
    const cu = prisma.gates.get('user-d')?.cooldownUntil?.getTime() ?? 0;
    expect(cu - before).toBeGreaterThanOrEqual(PASTOR_MODE_GATE_COOLDOWN_MS - 1000);
    expect(cu - before).toBeLessThanOrEqual(PASTOR_MODE_GATE_COOLDOWN_MS + 1000);
  });
});

describe('PastorModeGateService — affidavit path', () => {
  it('attested + liveness selfie → pass', async () => {
    const { svc, prisma } = makeService();
    const r = await svc.attestAffidavit('user-e', {
      attested: true,
      livenessSelfieKey: 'photos/liveness/abc.jpg',
    });
    expect(r.passed).toBe(true);
    expect(prisma.gates.get('user-e')?.attestationKind).toBe('affidavit');
  });

  it('declined → neutral-fail (audit reason: affidavit_declined)', async () => {
    const { svc, prisma } = makeService();
    const r = await svc.attestAffidavit('user-f', { attested: false });
    expect(r.passed).toBe(false);
    expect(r.messageId).toBe(PASTOR_MODE_NEUTRAL_FAIL_ID);
    expect(prisma.attempts[0]?.internalReason).toBe('affidavit_declined');
  });

  it('attested without liveness key → neutral-fail (audit reason: liveness_failed)', async () => {
    const { svc, prisma } = makeService();
    const r = await svc.attestAffidavit('user-g', { attested: true });
    expect(r.passed).toBe(false);
    expect(prisma.attempts[0]?.internalReason).toBe('liveness_failed');
  });
});

describe('PastorModeGateService — getStatus', () => {
  it('returns none for fresh user', async () => {
    const { svc } = makeService();
    expect(await svc.getStatus('fresh')).toEqual({
      status: 'none',
      passedAt: null,
      cooldownUntil: null,
    });
  });

  it('returns passed + passedAt for verified user', async () => {
    const { svc } = makeService();
    await svc.verifyKtp('verified', { dobIso: '1990-04-29' });
    const status = await svc.getStatus('verified');
    expect(status.status).toBe('passed');
    expect(status.passedAt).toBeTruthy();
  });
});
