import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { MessageInput } from '@blesscupid/moderation';
import { PrismaService } from '../prisma/prisma.service.js';
import { PrismaModerationStore } from '../chat/prisma-moderation-store.js';

export type ResolveAction = 'approve' | 'reject';

@Injectable()
export class ModerationQueueService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly store: PrismaModerationStore,
  ) {}

  async listPending(limit = 50) {
    const items = await this.store.listPending(limit);
    return { items };
  }

  async resolve(id: string, action: ResolveAction, reviewerUserId: string, note?: string) {
    const targetStatus = action === 'approve' ? 'approved' : 'rejected';
    const item = await this.store.resolve(id, targetStatus, reviewerUserId, note);
    if (!item) throw new NotFoundException({ code: 'queue_item_not_found' });

    if (action !== 'approve') return { item, deliveredMessageId: null };

    // For text items, find any message rows previously held in `queued` state
    // attached to this queue id and flip them to delivered.
    let deliveredMessageId: string | null = null;
    if (item.kind === 'text') {
      const messages = await this.prisma.message.findMany({
        where: { queueItemId: id, status: 'queued' },
      });
      if (messages.length === 0) {
        // No held message — synthesize delivery from the queued payload so
        // the recipient still sees the approved content.
        const payload = item.payload as MessageInput;
        if (!payload.threadId || !payload.senderUserId || !payload.recipientUserId) {
          throw new BadRequestException({ code: 'queue_item_missing_payload' });
        }
        const created = await this.prisma.message.create({
          data: {
            threadId: payload.threadId,
            senderUserId: payload.senderUserId,
            recipientUserId: payload.recipientUserId,
            body: payload.text,
            attachmentIds: payload.attachmentIds ?? [],
            status: 'delivered',
            deliveredAt: new Date(),
            queueItemId: id,
          },
        });
        deliveredMessageId = created.id;
      } else {
        const now = new Date();
        const updated = await this.prisma.message.updateMany({
          where: { queueItemId: id, status: 'queued' },
          data: { status: 'delivered', deliveredAt: now },
        });
        if (updated.count > 0) deliveredMessageId = messages[0]?.id ?? null;
      }
    }

    return { item, deliveredMessageId };
  }
}
