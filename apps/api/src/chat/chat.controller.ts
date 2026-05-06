import { Body, Controller, Get, HttpCode, Param, Post, Req, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { JwtAuthGuard, type AuthedRequest } from '../auth/jwt.guard.js';
import { ZodValidate } from '../common/zod.pipe.js';
import { ChatService } from './chat.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

const ANCHOR_VERSE = {
  verseText: '"Be anxious for nothing, but in everything by prayer…"',
  verseRef: 'Phil 4:6 · NIV',
};

const SendMessageSchema = z.object({
  recipientUserId: z.string().uuid(),
  text: z.string().min(1).max(2000),
  attachmentIds: z.array(z.string().uuid()).max(4).optional(),
});

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(
    private readonly chat: ChatService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('threads/:threadId/messages')
  @HttpCode(200)
  async sendMessage(
    @Req() req: AuthedRequest,
    @Param('threadId') threadId: string,
    @Body(ZodValidate(SendMessageSchema)) input: z.infer<typeof SendMessageSchema>,
  ) {
    return this.chat.sendMessage(req.user.userId, {
      threadId,
      recipientUserId: input.recipientUserId,
      text: input.text,
      ...(input.attachmentIds ? { attachmentIds: input.attachmentIds } : {}),
    });
  }

  @Get('threads/:threadId/messages')
  async list(@Req() req: AuthedRequest, @Param('threadId') threadId: string) {
    const userId = req.user.userId;
    const rows = await this.chat.listThreadMessages(userId, threadId);

    // Hydrate partner display name from Profile table.
    let partnerName = 'Friend';
    if (rows.length > 0) {
      const m = rows[0]!;
      const partnerId = m.senderUserId === userId ? m.recipientUserId : m.senderUserId;
      const profile = await this.prisma.profile.findUnique({
        where: { userId: partnerId },
        select: { displayName: true },
      });
      partnerName = profile?.displayName ?? 'Friend';
    }

    return {
      threadId,
      partnerDisplayName: partnerName,
      anchor: ANCHOR_VERSE,
      messages: rows.map((m) => ({
        id: m.id,
        from: m.senderUserId === userId ? ('me' as const) : ('them' as const),
        text: m.body,
        at: m.createdAt.toISOString(),
      })),
    };
  }
}
