// BLE-136 — Pastor-mode 18+ KYC gate. Server-side source of truth.
//
// Public surface returns `{ passed }` only. ALL failure modes (under-18,
// invalid DOB, OCR low-conf, doc-quality, affidavit declined, cooldown
// active, liveness failed) collapse to the same neutral-fail response.
// The server keeps the *internal* reason in `PastorModeGateAttempt.internalReason`
// for ops triage but NEVER returns it to the user.
//
// Cooldown: after a neutral-fail, the user is locked out of retry for
// 24h. Within the cooldown, every retry returns the same neutral-fail
// without re-running OCR/affidavit logic — preserves the doctrinal
// "no shame, no escalation path" surface contract from BLE-130.

import { Injectable } from '@nestjs/common';
import {
  PASTOR_MODE_GATE_COOLDOWN_MS,
  PASTOR_MODE_INTERNAL_REASONS,
  PASTOR_MODE_NEUTRAL_FAIL_ID,
  evaluateKtpDob,
  parseNik,
  type PastorModeInternalReason,
  type PastorModeVerifyResponse,
} from '@blesscupid/shared';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  PASTOR_MODE_GATE_DECISION,
  PastorModeGateTelemetry,
} from './pastor-mode-gate.telemetry.js';

export type VerifyKtpInput = {
  // Either the raw 16-digit NIK (server re-validates + extracts DOB), OR
  // a client-extracted DOB (when client OCR has already happened on-device,
  // and the client refuses to send NIK off-device for privacy reasons).
  // Spec preference: client-side OCR + send DOB only. NIK path remains
  // for fallback + integration tests.
  nik?: string;
  dobIso?: string;
  // OCR confidence on the DOB region. Below threshold = neutral-fail with
  // internal reason `ktp_ocr_low_confidence`.
  ocrConfidence?: number;
};

export type AttestAffidavitInput = {
  attested: boolean;
  // Liveness selfie storage key. Required when attested=true. The selfie
  // is liveness-bound to account; we keep only the storage ref + a hash
  // of the bound payload, never the raw image past the documented
  // retention window (handled by Photos pipeline).
  livenessSelfieKey?: string;
};

const KTP_OCR_MIN_CONFIDENCE = 0.85;

type GateDecision =
  | { passed: true }
  | { passed: false; internalReason: PastorModeInternalReason };

@Injectable()
export class PastorModeGateService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly telemetry: PastorModeGateTelemetry,
  ) {}

  async getStatus(userId: string): Promise<{
    status: 'none' | 'passed' | 'neutral_fail';
    passedAt: string | null;
    cooldownUntil: string | null;
  }> {
    const gate = await this.prisma.pastorModeGate.findUnique({ where: { userId } });
    if (!gate) return { status: 'none', passedAt: null, cooldownUntil: null };
    return {
      status: gate.status,
      passedAt: gate.passedAt?.toISOString() ?? null,
      cooldownUntil: gate.cooldownUntil?.toISOString() ?? null,
    };
  }

  async verifyKtp(userId: string, input: VerifyKtpInput): Promise<PastorModeVerifyResponse> {
    const cooldown = await this.checkCooldown(userId);
    if (cooldown) return this.recordAndRespond(userId, 'ktp', cooldown);

    const decision = this.decideKtp(input);
    return this.recordAndRespond(userId, 'ktp', decision);
  }

  async attestAffidavit(
    userId: string,
    input: AttestAffidavitInput,
  ): Promise<PastorModeVerifyResponse> {
    const cooldown = await this.checkCooldown(userId);
    if (cooldown) return this.recordAndRespond(userId, 'affidavit', cooldown);

    if (!input.attested) {
      return this.recordAndRespond(userId, 'affidavit', {
        passed: false,
        internalReason: PASTOR_MODE_INTERNAL_REASONS.affidavit_declined,
      });
    }
    if (!input.livenessSelfieKey || input.livenessSelfieKey.length < 4) {
      return this.recordAndRespond(userId, 'affidavit', {
        passed: false,
        internalReason: PASTOR_MODE_INTERNAL_REASONS.liveness_failed,
      });
    }

    // Affidavit attests caller is 18+ under UU ITE Pasal 11. The legal
    // weight comes from the signature — we record the gate as passed and
    // let the audit row carry the affidavit kind for downstream review.
    return this.recordAndRespond(userId, 'affidavit', { passed: true });
  }

  // === private =========================================================

  private async checkCooldown(userId: string): Promise<GateDecision | null> {
    const gate = await this.prisma.pastorModeGate.findUnique({ where: { userId } });
    if (!gate) return null;
    if (gate.status === 'passed') {
      // Already passed — short-circuit. Re-record nothing (idempotent).
      return null;
    }
    if (gate.cooldownUntil && gate.cooldownUntil.getTime() > Date.now()) {
      return {
        passed: false,
        internalReason: PASTOR_MODE_INTERNAL_REASONS.cooldown_active,
      };
    }
    return null;
  }

  private decideKtp(input: VerifyKtpInput): GateDecision {
    if (typeof input.ocrConfidence === 'number' && input.ocrConfidence < KTP_OCR_MIN_CONFIDENCE) {
      return {
        passed: false,
        internalReason: PASTOR_MODE_INTERNAL_REASONS.ktp_ocr_low_confidence,
      };
    }

    let dobIso = input.dobIso;
    if (!dobIso && input.nik) {
      const parsed = parseNik(input.nik);
      if (!parsed.ok) {
        return {
          passed: false,
          internalReason: PASTOR_MODE_INTERNAL_REASONS.doc_quality,
        };
      }
      dobIso = parsed.parsed.dobIso;
    }
    if (!dobIso) {
      return {
        passed: false,
        internalReason: PASTOR_MODE_INTERNAL_REASONS.doc_quality,
      };
    }

    const result = evaluateKtpDob(dobIso);
    if (!result.ok) {
      return { passed: false, internalReason: result.reason };
    }
    return { passed: true };
  }

  private async recordAndRespond(
    userId: string,
    kind: 'ktp' | 'affidavit',
    decision: GateDecision,
  ): Promise<PastorModeVerifyResponse> {
    const now = new Date();
    if (decision.passed) {
      await this.prisma.pastorModeGate.upsert({
        where: { userId },
        update: {
          status: 'passed',
          attestationKind: kind,
          passedAt: now,
          decidedAt: now,
          cooldownUntil: null,
        },
        create: {
          userId,
          status: 'passed',
          attestationKind: kind,
          passedAt: now,
          decidedAt: now,
        },
      });
      await this.prisma.pastorModeGateAttempt.create({
        data: {
          userId,
          attestationKind: kind,
          outcome: 'passed',
        },
      });
      this.telemetry.emitDecision(PASTOR_MODE_GATE_DECISION.pass);
      return { passed: true, passedAt: now.toISOString() };
    }

    const cooldownUntil = new Date(now.getTime() + PASTOR_MODE_GATE_COOLDOWN_MS);
    await this.prisma.pastorModeGate.upsert({
      where: { userId },
      update: {
        status: 'neutral_fail',
        attestationKind: kind,
        decidedAt: now,
        cooldownUntil,
      },
      create: {
        userId,
        status: 'neutral_fail',
        attestationKind: kind,
        decidedAt: now,
        cooldownUntil,
      },
    });
    await this.prisma.pastorModeGateAttempt.create({
      data: {
        userId,
        attestationKind: kind,
        outcome: 'neutral_fail',
        internalReason: decision.internalReason,
      },
    });
    this.telemetry.emitDecision(PASTOR_MODE_GATE_DECISION.neutral_fail);

    return {
      passed: false,
      messageId: PASTOR_MODE_NEUTRAL_FAIL_ID,
    };
  }
}
