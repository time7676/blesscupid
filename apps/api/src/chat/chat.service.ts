import { BadRequestException, Injectable } from '@nestjs/common';
import type { MessageInput, PipelineOutcome } from '@blesscupid/moderation';
import { PrismaService } from '../prisma/prisma.service.js';
import { ChatModerationPipeline } from './moderation-pipeline.provider.js';

export interface SendMessageInput {
  threadId: string;
  recipientUserId: string;
  text: string;
  attachmentIds?: string[];
}

export interface SendMessageResult {
  status: 'delivered' | 'queued' | 'blocked';
  messageId?: string;
  reasons: string[];
  flags: string[];
  reviewerNote: string;
}

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pipeline: ChatModerationPipeline,
  ) {}

  async sendMessage(senderUserId: string, input: SendMessageInput): Promise<SendMessageResult> {
    if (senderUserId === input.recipientUserId) {
      throw new BadRequestException({ code: 'cannot_message_self' });
    }

    const moderationInput: MessageInput = {
      threadId: input.threadId,
      senderUserId,
      recipientUserId: input.recipientUserId,
      text: input.text,
      ...(input.attachmentIds && input.attachmentIds.length
        ? { attachmentIds: input.attachmentIds }
        : {}),
      sentAt: new Date().toISOString(),
    };

    const textOutcome = await this.pipeline.moderateMessage(moderationInput);
    let outcome: PipelineOutcome = textOutcome;

    // If the text passed (or queued) and there are attachments, the most
    // restrictive image outcome wins. Any blocked attachment blocks the whole
    // message; any queued attachment downgrades a delivered text to queued.
    if (outcome.kind !== 'blocked' && input.attachmentIds?.length) {
      for (const attachmentId of input.attachmentIds) {
        const photo = await this.prisma.photo.findUnique({ where: { id: attachmentId } });
        if (!photo) {
          throw new BadRequestException({ code: 'attachment_not_found', attachmentId });
        }
        const imageOutcome = await this.pipeline.moderateImage({
          uploadId: attachmentId,
          uploaderUserId: senderUserId,
          storageKey: photo.storageKey,
          isProfilePhoto: false,
        });
        if (imageOutcome.kind === 'blocked') {
          outcome = imageOutcome;
          break;
        }
        if (imageOutcome.kind === 'queued' && outcome.kind === 'delivered') {
          outcome = imageOutcome;
        }
      }
    }

    if (outcome.kind === 'blocked') {
      return {
        status: 'blocked',
        reasons: outcome.result.reasons,
        flags: outcome.result.flags,
        reviewerNote: outcome.result.reviewerNote,
      };
    }

    if (outcome.kind === 'queued') {
      const message = await this.prisma.message.create({
        data: {
          threadId: input.threadId,
          senderUserId,
          recipientUserId: input.recipientUserId,
          body: input.text,
          attachmentIds: input.attachmentIds ?? [],
          status: 'queued',
          queueItemId: outcome.queuedItem.id,
        },
      });
      return {
        status: 'queued',
        messageId: message.id,
        reasons: outcome.result.reasons,
        flags: outcome.result.flags,
        reviewerNote: outcome.result.reviewerNote,
      };
    }

    const now = new Date();
    const message = await this.prisma.message.create({
      data: {
        threadId: input.threadId,
        senderUserId,
        recipientUserId: input.recipientUserId,
        body: input.text,
        attachmentIds: input.attachmentIds ?? [],
        status: 'delivered',
        deliveredAt: now,
      },
    });
    return {
      status: 'delivered',
      messageId: message.id,
      reasons: outcome.result.reasons,
      flags: outcome.result.flags,
      reviewerNote: outcome.result.reviewerNote,
    };
  }

  async listThreadMessages(userId: string, threadId: string) {
    return this.prisma.message.findMany({
      where: {
        threadId,
        OR: [{ senderUserId: userId }, { recipientUserId: userId }],
        status: 'delivered',
      },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        threadId: true,
        senderUserId: true,
        recipientUserId: true,
        body: true,
        attachmentIds: true,
        status: true,
        createdAt: true,
        deliveredAt: true,
      },
    });
  }
}
