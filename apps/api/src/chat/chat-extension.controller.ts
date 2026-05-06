/**
 * ChatExtensionController — endpoints needed by mobile that don't fit the
 * primary ChatController surface. Pre-alpha additions:
 *
 *   GET /chat/threads                       — list user's threads (pending + active)
 *   GET /chat/threads/:threadId             — wrapped messages w/ partner + anchor
 *
 * All routes JWT-gated. Returns mobile-shaped payloads.
 */

import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, type AuthedRequest } from '../auth/jwt.guard.js';
import { PrismaService } from '../prisma/prisma.service.js';

const ANCHOR_VERSE = {
  verseText: '"Be anxious for nothing, but in everything by prayer…"',
  verseRef: 'Phil 4:6 · NIV',
};

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatExtensionController {
  constructor(private readonly prisma: PrismaService) {}

  /** GET /chat/threads — list of threads w/ last message preview. */
  @Get('threads')
  async listThreads(@Req() req: AuthedRequest) {
    const userId = req.user.userId;

    const messages = await this.prisma.message.findMany({
      where: {
        OR: [{ senderUserId: userId }, { recipientUserId: userId }],
      },
      orderBy: { createdAt: 'desc' },
      select: {
        threadId: true,
        senderUserId: true,
        recipientUserId: true,
        body: true,
        createdAt: true,
        deliveredAt: true,
      },
    });

    // Group by threadId, keep most recent.
    const threadMap = new Map<
      string,
      {
        threadId: string;
        partnerUserId: string;
        lastBody: string | null;
        lastAt: Date | null;
        unread: boolean;
      }
    >();
    for (const m of messages) {
      const partnerId = m.senderUserId === userId ? m.recipientUserId : m.senderUserId;
      if (threadMap.has(m.threadId)) continue;
      threadMap.set(m.threadId, {
        threadId: m.threadId,
        partnerUserId: partnerId,
        lastBody: m.body,
        lastAt: m.createdAt,
        unread: m.recipientUserId === userId && m.deliveredAt === null,
      });
    }

    if (threadMap.size === 0) {
      return { pending: [], active: [] };
    }

    // Hydrate partner display names.
    const partnerIds = Array.from(new Set(Array.from(threadMap.values()).map((t) => t.partnerUserId)));
    const profiles = await this.prisma.profile.findMany({
      where: { userId: { in: partnerIds } },
      select: { userId: true, displayName: true },
    });
    const nameById = new Map(profiles.map((p) => [p.userId, p.displayName]));

    const all = Array.from(threadMap.values()).map((t) => ({
      threadId: t.threadId,
      partnerUserId: t.partnerUserId,
      partnerDisplayName: nameById.get(t.partnerUserId) ?? 'Friend',
      lastMessagePreview: t.lastBody,
      lastMessageAt: t.lastAt?.toISOString() ?? null,
      unread: t.unread,
      // Pre-alpha: any thread w/ ≥1 reply from partner = active. Otherwise pending.
      status: 'active' as const,
    }));

    // Split into pending vs active. Pre-alpha simplification: all active.
    return { pending: [] as typeof all, active: all };
  }

  /** GET /chat/threads/:threadId/wrapped — wrapped message list (mobile-shaped). */
  @Get('threads/:threadId/wrapped')
  async threadDetail(@Req() req: AuthedRequest, @Param('threadId') threadId: string) {
    const userId = req.user.userId;
    const messages = await this.prisma.message.findMany({
      where: {
        threadId,
        OR: [{ senderUserId: userId }, { recipientUserId: userId }],
      },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        senderUserId: true,
        body: true,
        createdAt: true,
      },
    });

    let partnerName = 'Friend';
    if (messages.length > 0) {
      const m = messages[0]!;
      const partnerId =
        m.senderUserId === userId
          ? // Find recipient from another row OR fallback
            messages.find((x) => x.senderUserId !== userId)?.senderUserId ?? userId
          : m.senderUserId;
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
      messages: messages.map((m) => ({
        id: m.id,
        from: m.senderUserId === userId ? ('me' as const) : ('them' as const),
        text: m.body,
        at: m.createdAt.toISOString(),
      })),
    };
  }
}
