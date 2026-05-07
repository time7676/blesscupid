import { Injectable, NotFoundException } from '@nestjs/common';
import type { ModerationDecision } from '@prisma/client';
import { PrismaModerationStore } from '../moderation/prisma-moderation-store.js';

/**
 * Read-only-ish admin queue: list pending ModerationQueueItem rows and mark
 * them resolved. v1-restart no longer mirrors approvals back into delivered
 * Message rows — the original moderation flow blocked at write time, not at
 * review time, so admin resolve is purely a labelling/audit op.
 */
@Injectable()
export class ModerationQueueService {
  constructor(private readonly store: PrismaModerationStore) {}

  async listPending(opts: { cursor?: string; limit?: number; decision?: ModerationDecision } = {}) {
    const items = await this.store.listPending(opts);
    return { items };
  }

  async resolve(
    id: string,
    resolution: 'approved' | 'rejected',
    reviewerUserId: string,
    notes?: string,
  ) {
    const item = await this.store.resolve(id, resolution, reviewerUserId, notes);
    if (!item) throw new NotFoundException({ code: 'queue_item_not_found' });
    return { item };
  }
}
