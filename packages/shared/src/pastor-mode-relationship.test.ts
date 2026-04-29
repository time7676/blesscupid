import { describe, it, expect } from 'vitest';
import {
  PASTOR_MODE_INVITE_GATE_REASONS,
  PASTOR_MODE_RELATIONSHIP_STATUS,
  evaluatePastorInviteAcceptance,
  isActiveStatus,
  isClosedStatus,
  pastorSealDueAt,
  PASTOR_MODE_TRANSCRIPT_SEAL_MS,
  relationshipDurationDays,
  renderHistoryRowDuration,
  renderInviteAlreadyPairedCopy,
  revocationStatusForActor,
  PASTOR_MODE_COPY,
} from './pastor-mode-relationship.js';

const baseInput = {
  inviteStatus: PASTOR_MODE_RELATIONSHIP_STATUS.pending,
  hasActiveRelationship: false,
  acceptingUserIsInvitee: true,
  pastorIsDifferentUser: true,
  ageGatePassed: true,
};

describe('evaluatePastorInviteAcceptance', () => {
  it('happy path: pending invite, no active relationship, age gate passed', () => {
    expect(evaluatePastorInviteAcceptance(baseInput)).toEqual({ acceptable: true });
  });

  it('rejects when audited user already has an active pastor (the BLE-131 rule)', () => {
    const r = evaluatePastorInviteAcceptance({ ...baseInput, hasActiveRelationship: true });
    expect(r).toEqual({
      acceptable: false,
      reason: PASTOR_MODE_INVITE_GATE_REASONS.already_paired,
    });
  });

  it('rejects when invite is not pending', () => {
    for (const s of [
      PASTOR_MODE_RELATIONSHIP_STATUS.active,
      PASTOR_MODE_RELATIONSHIP_STATUS.ended_by_audited,
      PASTOR_MODE_RELATIONSHIP_STATUS.ended_by_pastor,
      PASTOR_MODE_RELATIONSHIP_STATUS.declined_by_audited,
      PASTOR_MODE_RELATIONSHIP_STATUS.expired,
    ]) {
      const r = evaluatePastorInviteAcceptance({ ...baseInput, inviteStatus: s });
      expect(r).toEqual({
        acceptable: false,
        reason: PASTOR_MODE_INVITE_GATE_REASONS.invite_not_pending,
      });
    }
  });

  it('rejects when caller is not the invitee', () => {
    const r = evaluatePastorInviteAcceptance({ ...baseInput, acceptingUserIsInvitee: false });
    expect(r).toEqual({
      acceptable: false,
      reason: PASTOR_MODE_INVITE_GATE_REASONS.not_invitee,
    });
  });

  it('rejects self-invite', () => {
    const r = evaluatePastorInviteAcceptance({ ...baseInput, pastorIsDifferentUser: false });
    expect(r).toEqual({
      acceptable: false,
      reason: PASTOR_MODE_INVITE_GATE_REASONS.invite_self,
    });
  });

  it('rejects when age gate not passed', () => {
    const r = evaluatePastorInviteAcceptance({ ...baseInput, ageGatePassed: false });
    expect(r).toEqual({
      acceptable: false,
      reason: PASTOR_MODE_INVITE_GATE_REASONS.age_gate_not_passed,
    });
  });

  it('rejects when invite has expired', () => {
    const now = new Date('2026-04-29T10:00:00Z');
    const r = evaluatePastorInviteAcceptance({
      ...baseInput,
      now,
      inviteExpiresAt: new Date('2026-04-28T10:00:00Z'),
    });
    expect(r).toEqual({
      acceptable: false,
      reason: PASTOR_MODE_INVITE_GATE_REASONS.invite_expired,
    });
  });

  it('accepts when expiry is in the future', () => {
    const now = new Date('2026-04-29T10:00:00Z');
    const r = evaluatePastorInviteAcceptance({
      ...baseInput,
      now,
      inviteExpiresAt: new Date('2026-04-30T10:00:00Z'),
    });
    expect(r).toEqual({ acceptable: true });
  });

  it('reason ordering: not_invitee outranks already_paired (caller-id error before doctrine)', () => {
    const r = evaluatePastorInviteAcceptance({
      ...baseInput,
      acceptingUserIsInvitee: false,
      hasActiveRelationship: true,
    });
    expect(r).toEqual({
      acceptable: false,
      reason: PASTOR_MODE_INVITE_GATE_REASONS.not_invitee,
    });
  });

  it('reason ordering: age_gate_not_passed outranks already_paired', () => {
    const r = evaluatePastorInviteAcceptance({
      ...baseInput,
      ageGatePassed: false,
      hasActiveRelationship: true,
    });
    expect(r).toEqual({
      acceptable: false,
      reason: PASTOR_MODE_INVITE_GATE_REASONS.age_gate_not_passed,
    });
  });
});

describe('status helpers', () => {
  it('isActiveStatus: only `active` is active', () => {
    expect(isActiveStatus(PASTOR_MODE_RELATIONSHIP_STATUS.active)).toBe(true);
    expect(isActiveStatus(PASTOR_MODE_RELATIONSHIP_STATUS.pending)).toBe(false);
    expect(isActiveStatus(PASTOR_MODE_RELATIONSHIP_STATUS.ended_by_audited)).toBe(false);
  });

  it('isClosedStatus: terminal statuses are closed', () => {
    expect(isClosedStatus(PASTOR_MODE_RELATIONSHIP_STATUS.ended_by_audited)).toBe(true);
    expect(isClosedStatus(PASTOR_MODE_RELATIONSHIP_STATUS.ended_by_pastor)).toBe(true);
    expect(isClosedStatus(PASTOR_MODE_RELATIONSHIP_STATUS.declined_by_audited)).toBe(true);
    expect(isClosedStatus(PASTOR_MODE_RELATIONSHIP_STATUS.expired)).toBe(true);
    expect(isClosedStatus(PASTOR_MODE_RELATIONSHIP_STATUS.active)).toBe(false);
    expect(isClosedStatus(PASTOR_MODE_RELATIONSHIP_STATUS.pending)).toBe(false);
  });
});

describe('revocationStatusForActor', () => {
  it('audited revoke -> ended_by_audited', () => {
    expect(revocationStatusForActor('audited')).toBe(
      PASTOR_MODE_RELATIONSHIP_STATUS.ended_by_audited,
    );
  });
  it('pastor step-away -> ended_by_pastor', () => {
    expect(revocationStatusForActor('pastor')).toBe(
      PASTOR_MODE_RELATIONSHIP_STATUS.ended_by_pastor,
    );
  });
});

describe('pastorSealDueAt', () => {
  it('returns endedAt + 24h', () => {
    const ended = new Date('2026-04-29T10:00:00Z');
    const due = pastorSealDueAt(ended);
    expect(due.getTime() - ended.getTime()).toBe(PASTOR_MODE_TRANSCRIPT_SEAL_MS);
  });
});

describe('renderInviteAlreadyPairedCopy', () => {
  it('substitutes {{pastorName}}', () => {
    expect(renderInviteAlreadyPairedCopy('Daniel')).toBe(
      'Anda sedang berjalan bersama Pastor Daniel. Akhiri perjalanan itu dulu untuk menerima undangan baru.',
    );
  });
  it('trims the name', () => {
    expect(renderInviteAlreadyPairedCopy('  Yosua  ')).toContain('Pastor Yosua.');
  });
  it('uses the canonical issue-body Indonesian copy verbatim for `Daniel`', () => {
    expect(renderInviteAlreadyPairedCopy('Daniel')).toBe(
      PASTOR_MODE_COPY.invite_gate_already_paired_template.replace('{{pastorName}}', 'Daniel'),
    );
  });
});

describe('renderHistoryRowDuration', () => {
  it('formats duration row label', () => {
    expect(renderHistoryRowDuration(14)).toBe('14 hari · sudah selesai');
  });
  it('floors decimal days', () => {
    expect(renderHistoryRowDuration(13.9)).toBe('13 hari · sudah selesai');
  });
  it('clamps negative input to 0', () => {
    expect(renderHistoryRowDuration(-3)).toBe('0 hari · sudah selesai');
  });
});

describe('relationshipDurationDays', () => {
  it('counts whole days only', () => {
    const accepted = new Date('2026-04-01T00:00:00Z');
    const ended = new Date('2026-04-15T00:00:00Z');
    expect(relationshipDurationDays(accepted, ended)).toBe(14);
  });
  it('returns 0 if not accepted yet', () => {
    expect(relationshipDurationDays(null, new Date())).toBe(0);
  });
  it('returns 0 if ended before accepted (clock skew guard)', () => {
    const accepted = new Date('2026-04-15T00:00:00Z');
    const ended = new Date('2026-04-01T00:00:00Z');
    expect(relationshipDurationDays(accepted, ended)).toBe(0);
  });
});
