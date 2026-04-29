/**
 * BLE-132 — minimal in-memory Prisma stand-in for walking-with tests.
 *
 * Implements only the surface the walking-with code paths touch. The
 * goal is correctness on a real schema, not Prisma re-implementation.
 */
import type { PrismaService } from '../prisma/prisma.service.js';

export type State =
  | 'invited'
  | 'accepted'
  | 'walking'
  | 'revoked'
  | 'sealed'
  | 'hard_deleted';

export interface RelRow {
  id: string;
  pastorUserId: string;
  auditedUserId: string;
  state: State;
  invitedAt: Date;
  acceptedAt: Date | null;
  walkingAt: Date | null;
  revokedAt: Date | null;
  sealedAt: Date | null;
  hardDeletedAt: Date | null;
  legalHold: boolean;
  sealAuditId: string | null;
  auditedUser?: {
    id: string;
    profile?: { displayName: string } | null;
  };
}

export interface NoteRow {
  id: string;
  relationshipId: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
  auditedUserSnapshot: unknown | null;
}

export interface TranscriptRow {
  id: string;
  relationshipId: string;
  threadId: string;
  body: string;
  authoredAt: Date;
}

interface RelWhere {
  id?: string;
  state?: State | { in: State[] };
  revokedAt?: { lte: Date };
  sealedAt?: { lte: Date };
  legalHold?: boolean;
  pastorUserId?: string;
}

function relMatches(r: RelRow, where: RelWhere | undefined): boolean {
  if (!where) return true;
  if (where.id !== undefined && r.id !== where.id) return false;
  if (where.pastorUserId !== undefined && r.pastorUserId !== where.pastorUserId) return false;
  if (where.legalHold !== undefined && r.legalHold !== where.legalHold) return false;
  if (where.state !== undefined) {
    if (typeof where.state === 'object' && 'in' in where.state) {
      if (!where.state.in.includes(r.state)) return false;
    } else if (r.state !== where.state) return false;
  }
  if (where.revokedAt?.lte && (!r.revokedAt || r.revokedAt.getTime() > where.revokedAt.lte.getTime())) {
    return false;
  }
  if (where.sealedAt?.lte && (!r.sealedAt || r.sealedAt.getTime() > where.sealedAt.lte.getTime())) {
    return false;
  }
  return true;
}

export class FakePrisma {
  rels: RelRow[] = [];
  notes: NoteRow[] = [];
  transcripts: TranscriptRow[] = [];

  pastorRelationship = {
    findUnique: async ({ where }: { where: { id: string } }) => {
      return this.rels.find((r) => r.id === where.id) ?? null;
    },
    findMany: async (args: {
      where?: RelWhere;
      include?: { auditedUser?: unknown; notes?: unknown };
      orderBy?: unknown;
      take?: number;
    }) => {
      const matches = this.rels.filter((r) => relMatches(r, args.where));
      const limited = args.take ? matches.slice(0, args.take) : matches;
      if (args.include?.auditedUser) {
        return limited.map((r) => ({ ...r }));
      }
      if (args.include?.notes) {
        return limited.map((r) => ({
          ...r,
          notes: this.notes.filter((n) => n.relationshipId === r.id),
        }));
      }
      return limited.map((r) => ({ ...r }));
    },
    update: async ({ where, data }: { where: { id: string }; data: Partial<RelRow> }) => {
      const r = this.rels.find((x) => x.id === where.id);
      if (!r) throw new Error('not found');
      Object.assign(r, data);
      return r;
    },
  };

  pastorNote = {
    findMany: async ({ where }: { where: { relationshipId: string } }) => {
      return this.notes.filter((n) => n.relationshipId === where.relationshipId);
    },
    updateMany: async ({
      where,
      data,
    }: {
      where: { relationshipId: string; auditedUserSnapshot?: { equals: unknown } };
      data: Partial<NoteRow>;
    }) => {
      let count = 0;
      for (const n of this.notes) {
        if (n.relationshipId !== where.relationshipId) continue;
        if (where.auditedUserSnapshot && where.auditedUserSnapshot.equals === null) {
          if (n.auditedUserSnapshot !== null) continue;
        }
        Object.assign(n, data);
        count++;
      }
      return { count };
    },
  };

  transcriptMessage = {
    findMany: async ({ where, orderBy }: {
      where: { relationshipId: string; threadId: string };
      orderBy?: { authoredAt: 'asc' | 'desc' };
    }) => {
      const list = this.transcripts.filter(
        (t) => t.relationshipId === where.relationshipId && t.threadId === where.threadId,
      );
      const dir = orderBy?.authoredAt === 'desc' ? -1 : 1;
      return list.sort((a, b) => dir * (a.authoredAt.getTime() - b.authoredAt.getTime()));
    },
    deleteMany: async ({ where }: { where: { relationshipId: string } }) => {
      const before = this.transcripts.length;
      this.transcripts = this.transcripts.filter((t) => t.relationshipId !== where.relationshipId);
      return { count: before - this.transcripts.length };
    },
  };

  $transaction = async <T>(ops: Promise<T>[] | (() => Promise<T>)): Promise<T[]> => {
    if (typeof ops === 'function') {
      return [await ops()] as unknown as T[];
    }
    return Promise.all(ops);
  };
}

export const asPrisma = (fake: FakePrisma): PrismaService => fake as unknown as PrismaService;
