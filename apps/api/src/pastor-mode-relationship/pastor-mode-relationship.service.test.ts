/**
 * BLE-131 — Pastor-mode 1:1 audited-side enforcement service tests.
 *
 * Covers:
 *   - happy-path accept flips status pending → active
 *   - 2nd concurrent accept on a 2nd invite throws
 *     PastorModeAlreadyPairedException with the BLE-131 gate copy
 *   - getAuditedUserView surfaces the gate copy on every pending invite
 *     when an active pastor exists
 *   - revoke(audited) sets pastorSealDueAt = endedAt + 24h (BLE-132 hook)
 *   - revoke(pastor) does NOT set pastorSealDueAt (asymmetric per BLE-132)
 *   - decline transitions invite → declined_by_audited
 *   - non-invitee accept rejected with 403
 *   - history rows return durationLabel using the canonical IDN copy
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { ConflictException, ForbiddenException } from '@nestjs/common';
import {
  PASTOR_MODE_COPY,
  PASTOR_MODE_RELATIONSHIP_STATUS,
  PASTOR_MODE_TRANSCRIPT_SEAL_MS,
} from '@blesscupid/shared';
import {
  PastorModeAlreadyPairedException,
  PastorModeRelationshipService,
} from './pastor-mode-relationship.service.js';

type Status =
  | 'pending'
  | 'active'
  | 'ended_by_audited'
  | 'ended_by_pastor'
  | 'declined_by_audited'
  | 'expired';

interface RelRow {
  id: string;
  auditedUserId: string;
  pastorUserId: string;
  status: Status;
  invitedAt: Date;
  acceptedAt: Date | null;
  endedAt: Date | null;
  inviteNote: string | null;
  pastorSealDueAt: Date | null;
}

interface ProfileRow {
  userId: string;
  displayName: string;
}

interface GateRow {
  userId: string;
  status: 'none' | 'passed' | 'neutral_fail';
}

class FakePrisma {
  rels = new Map<string, RelRow>();
  profiles = new Map<string, ProfileRow>();
  gates = new Map<string, GateRow>();

  pastorModeRelationship = {
    create: async ({ data }: { data: Omit<RelRow, 'id' | 'invitedAt' | 'acceptedAt' | 'endedAt' | 'pastorSealDueAt' | 'inviteNote'> & { inviteNote?: string } }) => {
      const id = `rel-${this.rels.size + 1}`;
      const row: RelRow = {
        id,
        auditedUserId: data.auditedUserId,
        pastorUserId: data.pastorUserId,
        status: data.status,
        invitedAt: new Date(),
        acceptedAt: null,
        endedAt: null,
        inviteNote: data.inviteNote ?? null,
        pastorSealDueAt: null,
      };
      this.rels.set(id, row);
      return { id };
    },
    findUnique: async ({ where }: { where: { id: string } }) =>
      this.rels.get(where.id) ?? null,
    findFirst: async ({ where }: { where: { auditedUserId: string; status: Status } }) => {
      for (const r of this.rels.values()) {
        if (r.auditedUserId === where.auditedUserId && r.status === where.status) {
          const p = this.profiles.get(r.pastorUserId);
          return {
            ...r,
            pastor: { profile: p ? { displayName: p.displayName } : null },
          };
        }
      }
      return null;
    },
    findMany: async ({ where, orderBy: _orderBy, select: _select }: { where: { auditedUserId?: string; pastorUserId?: string; status: Status | { in: Status[] } }; orderBy?: unknown; select?: unknown }) => {
      const all: RelRow[] = [];
      for (const r of this.rels.values()) {
        if (where.auditedUserId && r.auditedUserId !== where.auditedUserId) continue;
        if (where.pastorUserId && r.pastorUserId !== where.pastorUserId) continue;
        if (typeof where.status === 'object' && 'in' in where.status) {
          if (!where.status.in.includes(r.status)) continue;
        } else if (where.status && r.status !== where.status) {
          continue;
        }
        all.push(r);
      }
      return all.map((r) => ({
        ...r,
        pastor: { profile: this.profiles.get(r.pastorUserId) ? { displayName: this.profiles.get(r.pastorUserId)!.displayName } : null },
        audited: { profile: this.profiles.get(r.auditedUserId) ? { displayName: this.profiles.get(r.auditedUserId)!.displayName } : null },
      }));
    },
    count: async ({ where }: { where: { auditedUserId: string; status: Status } }) => {
      let n = 0;
      for (const r of this.rels.values()) {
        if (r.auditedUserId === where.auditedUserId && r.status === where.status) n++;
      }
      return n;
    },
    update: async ({ where, data }: { where: { id: string }; data: Partial<RelRow> }) => {
      const r = this.rels.get(where.id);
      if (!r) throw new Error('rel not found');
      Object.assign(r, data);
      return { id: r.id };
    },
  };

  pastorModeGate = {
    findUnique: async ({ where }: { where: { userId: string } }) =>
      this.gates.get(where.userId) ?? null,
  };

  // Service uses $transaction. We just call the callback with `this`
  // (no isolation enforcement — fine for unit-level coverage of the
  // application-level 1:1 check).
  $transaction = async <T>(fn: (tx: FakePrisma) => Promise<T>): Promise<T> => fn(this);
}

const PASTOR_DANIEL = 'pastor-daniel';
const PASTOR_YOSUA = 'pastor-yosua';
const MAYA = 'audited-maya';

function setupFresh(): { prisma: FakePrisma; svc: PastorModeRelationshipService } {
  const prisma = new FakePrisma();
  prisma.profiles.set(PASTOR_DANIEL, { userId: PASTOR_DANIEL, displayName: 'Daniel' });
  prisma.profiles.set(PASTOR_YOSUA, { userId: PASTOR_YOSUA, displayName: 'Yosua' });
  prisma.profiles.set(MAYA, { userId: MAYA, displayName: 'Maya' });
  prisma.gates.set(MAYA, { userId: MAYA, status: 'passed' });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const svc = new PastorModeRelationshipService(prisma as any);
  return { prisma, svc };
}

describe('PastorModeRelationshipService.accept', () => {
  it('happy path: pending invite flips to active when audited has no other active pastor', async () => {
    const { prisma, svc } = setupFresh();
    const invite = await svc.invite({ pastorUserId: PASTOR_DANIEL, auditedUserId: MAYA });
    const result = await svc.accept({ invitationId: invite.id, auditedUserId: MAYA });
    expect(result.id).toBe(invite.id);
    expect(prisma.rels.get(invite.id)?.status).toBe(PASTOR_MODE_RELATIONSHIP_STATUS.active);
    expect(prisma.rels.get(invite.id)?.acceptedAt).toBeInstanceOf(Date);
  });

  it('BLE-131 rule: a 2nd accept while an active pastor exists rejects with already-paired + Pastor copy', async () => {
    const { svc } = setupFresh();
    const inviteA = await svc.invite({ pastorUserId: PASTOR_DANIEL, auditedUserId: MAYA });
    await svc.accept({ invitationId: inviteA.id, auditedUserId: MAYA });

    const inviteB = await svc.invite({ pastorUserId: PASTOR_YOSUA, auditedUserId: MAYA });
    let caught: PastorModeAlreadyPairedException | null = null;
    try {
      await svc.accept({ invitationId: inviteB.id, auditedUserId: MAYA });
    } catch (e) {
      if (e instanceof PastorModeAlreadyPairedException) caught = e;
      else throw e;
    }
    expect(caught).not.toBeNull();
    const body = caught!.getResponse() as Record<string, unknown>;
    expect(body.code).toBe('pastor_mode_already_paired');
    expect(body.messageId).toBe(PASTOR_MODE_COPY.invite_gate_already_paired_id);
    expect(body.message).toBe(
      'Anda sedang berjalan bersama Pastor Daniel. Akhiri perjalanan itu dulu untuk menerima undangan baru.',
    );
  });

  it('rejects acceptance by a non-invitee with 403', async () => {
    const { svc } = setupFresh();
    const invite = await svc.invite({ pastorUserId: PASTOR_DANIEL, auditedUserId: MAYA });
    await expect(
      svc.accept({ invitationId: invite.id, auditedUserId: 'someone-else' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects acceptance when audited user has not passed the 18+ gate', async () => {
    const { prisma, svc } = setupFresh();
    prisma.gates.set(MAYA, { userId: MAYA, status: 'neutral_fail' });
    const invite = await svc.invite({ pastorUserId: PASTOR_DANIEL, auditedUserId: MAYA });
    await expect(
      svc.accept({ invitationId: invite.id, auditedUserId: MAYA }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects acceptance when invite is not pending', async () => {
    const { svc } = setupFresh();
    const invite = await svc.invite({ pastorUserId: PASTOR_DANIEL, auditedUserId: MAYA });
    await svc.accept({ invitationId: invite.id, auditedUserId: MAYA });
    // 2nd accept on the same (already active) invite → 409 invite_unavailable
    let caught: ConflictException | PastorModeAlreadyPairedException | null = null;
    try {
      await svc.accept({ invitationId: invite.id, auditedUserId: MAYA });
    } catch (e) {
      if (e instanceof ConflictException) caught = e;
      else throw e;
    }
    expect(caught).not.toBeNull();
    // Could be either flavor of conflict — both are acceptable. The
    // important guard is "no second active row created".
  });
});

describe('PastorModeRelationshipService.getAuditedUserView', () => {
  it('marks every pending invite as blocked when an active pastor exists, with the BLE-131 copy', async () => {
    const { svc } = setupFresh();
    const inviteA = await svc.invite({ pastorUserId: PASTOR_DANIEL, auditedUserId: MAYA });
    await svc.accept({ invitationId: inviteA.id, auditedUserId: MAYA });
    await svc.invite({ pastorUserId: PASTOR_YOSUA, auditedUserId: MAYA });

    const view = await svc.getAuditedUserView(MAYA);
    expect(view.active?.pastorDisplayName).toBe('Daniel');
    expect(view.pendingInvites.length).toBe(1);
    const pending = view.pendingInvites[0]!;
    expect(pending.blockedReason).toBe('already_paired');
    expect(pending.blockedCopy).toBe(
      'Anda sedang berjalan bersama Pastor Daniel. Akhiri perjalanan itu dulu untuk menerima undangan baru.',
    );
    expect(pending.blockedCopyId).toBe(PASTOR_MODE_COPY.invite_gate_already_paired_id);
  });

  it('history surfaces durationLabel + status for closed walks (Surface 6)', async () => {
    const { prisma, svc } = setupFresh();
    const accepted = new Date('2026-04-01T00:00:00Z');
    const ended = new Date('2026-04-15T00:00:00Z');
    prisma.rels.set('rel-closed', {
      id: 'rel-closed',
      auditedUserId: MAYA,
      pastorUserId: PASTOR_DANIEL,
      status: 'ended_by_audited',
      invitedAt: new Date('2026-03-30T00:00:00Z'),
      acceptedAt: accepted,
      endedAt: ended,
      inviteNote: null,
      pastorSealDueAt: new Date(ended.getTime() + PASTOR_MODE_TRANSCRIPT_SEAL_MS),
    });

    const view = await svc.getAuditedUserView(MAYA);
    expect(view.history.length).toBe(1);
    const row = view.history[0]!;
    expect(row.durationDays).toBe(14);
    expect(row.durationLabel).toBe('14 hari · sudah selesai');
    expect(row.status).toBe('ended_by_audited');
  });
});

describe('PastorModeRelationshipService.revoke', () => {
  it('audited revoke sets endedAt and pastorSealDueAt = endedAt + 24h (BLE-132 hook)', async () => {
    const { prisma, svc } = setupFresh();
    const inviteA = await svc.invite({ pastorUserId: PASTOR_DANIEL, auditedUserId: MAYA });
    await svc.accept({ invitationId: inviteA.id, auditedUserId: MAYA });

    await svc.revoke({ relationshipId: inviteA.id, actorUserId: MAYA, actor: 'audited' });
    const row = prisma.rels.get(inviteA.id)!;
    expect(row.status).toBe('ended_by_audited');
    expect(row.endedAt).toBeInstanceOf(Date);
    expect(row.pastorSealDueAt).toBeInstanceOf(Date);
    expect(row.pastorSealDueAt!.getTime() - row.endedAt!.getTime()).toBe(
      PASTOR_MODE_TRANSCRIPT_SEAL_MS,
    );
  });

  it('pastor revoke (Mundur) does NOT set pastorSealDueAt', async () => {
    const { prisma, svc } = setupFresh();
    const invite = await svc.invite({ pastorUserId: PASTOR_DANIEL, auditedUserId: MAYA });
    await svc.accept({ invitationId: invite.id, auditedUserId: MAYA });

    await svc.revoke({
      relationshipId: invite.id,
      actorUserId: PASTOR_DANIEL,
      actor: 'pastor',
    });
    const row = prisma.rels.get(invite.id)!;
    expect(row.status).toBe('ended_by_pastor');
    expect(row.endedAt).toBeInstanceOf(Date);
    expect(row.pastorSealDueAt).toBeNull();
  });

  it('rejects revoke by a non-party with 403', async () => {
    const { svc } = setupFresh();
    const invite = await svc.invite({ pastorUserId: PASTOR_DANIEL, auditedUserId: MAYA });
    await svc.accept({ invitationId: invite.id, auditedUserId: MAYA });
    await expect(
      svc.revoke({ relationshipId: invite.id, actorUserId: 'stranger', actor: 'audited' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('after audited revoke, audited may accept a fresh invite (1:1 rule lifts)', async () => {
    const { svc } = setupFresh();
    const inviteA = await svc.invite({ pastorUserId: PASTOR_DANIEL, auditedUserId: MAYA });
    await svc.accept({ invitationId: inviteA.id, auditedUserId: MAYA });
    await svc.revoke({ relationshipId: inviteA.id, actorUserId: MAYA, actor: 'audited' });

    const inviteB = await svc.invite({ pastorUserId: PASTOR_YOSUA, auditedUserId: MAYA });
    const result = await svc.accept({ invitationId: inviteB.id, auditedUserId: MAYA });
    expect(result.id).toBe(inviteB.id);
  });
});

describe('PastorModeRelationshipService.decline', () => {
  it('declined invite transitions to declined_by_audited', async () => {
    const { prisma, svc } = setupFresh();
    const invite = await svc.invite({ pastorUserId: PASTOR_DANIEL, auditedUserId: MAYA });
    await svc.decline({ invitationId: invite.id, auditedUserId: MAYA });
    expect(prisma.rels.get(invite.id)?.status).toBe('declined_by_audited');
    expect(prisma.rels.get(invite.id)?.endedAt).toBeInstanceOf(Date);
  });

  it('rejects decline by non-invitee with 403', async () => {
    const { svc } = setupFresh();
    const invite = await svc.invite({ pastorUserId: PASTOR_DANIEL, auditedUserId: MAYA });
    await expect(
      svc.decline({ invitationId: invite.id, auditedUserId: 'stranger' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});

describe('PastorModeRelationshipService.getPastorSidebar (1:N pastor side)', () => {
  it('lists multiple active audited users for a single pastor', async () => {
    const { prisma, svc } = setupFresh();
    prisma.profiles.set('audited-1', { userId: 'audited-1', displayName: 'Sarah' });
    prisma.profiles.set('audited-2', { userId: 'audited-2', displayName: 'Rebecca' });
    prisma.gates.set('audited-1', { userId: 'audited-1', status: 'passed' });
    prisma.gates.set('audited-2', { userId: 'audited-2', status: 'passed' });

    const a = await svc.invite({ pastorUserId: PASTOR_DANIEL, auditedUserId: 'audited-1' });
    const b = await svc.invite({ pastorUserId: PASTOR_DANIEL, auditedUserId: 'audited-2' });
    await svc.accept({ invitationId: a.id, auditedUserId: 'audited-1' });
    await svc.accept({ invitationId: b.id, auditedUserId: 'audited-2' });

    const entries = await svc.getPastorSidebar(PASTOR_DANIEL);
    const active = entries.filter((e) => e.status === 'active');
    expect(active.length).toBe(2);
    expect(new Set(active.map((e) => e.auditedDisplayName))).toEqual(
      new Set(['Sarah', 'Rebecca']),
    );
  });
});
