// BLE v1-restart — ChatService.
//
// Responsibilities:
//   - List threads for a user (cursor-paginated, derived unread bool).
//   - Fetch thread metadata (anchor + counterpart).
//   - Paginated message history (reverse-chronological).
//   - Idempotent send: enforces (threadId, clientMessageId) unique key.
//   - Block-relationship guard: reject if either user blocked the other.
//   - Moderation pipeline: text classifier → allow / review / block.
//   - Notification fan-out: write Notification row + enqueue push.
//   - Archive / unarchive a thread.
//
// Holy Code §HCoC: NO read receipts, NO typing indicators, NO presence.

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { TextClassifier } from '@blesscupid/moderation';
import { PrismaService } from '../prisma/prisma.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { VerseService } from '../verse/verse.service.js';
import type {
  CounterpartSummaryDto,
  MessageDto,
  PaginatedMessagesDto,
  PaginatedThreadsDto,
  SuggestionDto,
  ThreadDetailDto,
  ThreadListItemDto,
} from './dtos.js';

const PAGE_SIZE = 20;

interface CursorPayload {
  lastId: string;
  lastCreatedAt: string; // ISO string
}

function encodeCursor(payload: CursorPayload): string {
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
}

function decodeCursor(cursor: string | undefined | null): CursorPayload | null {
  if (!cursor) return null;
  try {
    const json = Buffer.from(cursor, 'base64url').toString('utf8');
    const parsed = JSON.parse(json) as CursorPayload;
    if (typeof parsed.lastId !== 'string' || typeof parsed.lastCreatedAt !== 'string') {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export interface SendMessageInput {
  threadId: string;
  senderId: string;
  body: string;
  kind: 'text' | 'verse_share';
  verseRef?: string;
  clientMessageId: string; // UUID provided by client; idempotency key
}

export interface SendMessageResult {
  message: MessageDto;
  duplicated: boolean;
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private readonly textClassifier = new TextClassifier({});

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly verse: VerseService,
  ) {}

  // -------------------------------------------------------------------------
  // Listing
  // -------------------------------------------------------------------------

  async getThreads(userId: string, cursor?: string | null): Promise<PaginatedThreadsDto> {
    const cursorPayload = decodeCursor(cursor);

    // Threads where the viewer is one of the match participants.
    const threads = await this.prisma.thread.findMany({
      where: {
        match: {
          OR: [{ userAId: userId }, { userBId: userId }],
        },
        // Only return threads that have actually been used (have a message)
        // OR are freshly archived. Filter null `lastMessageAt` out for now.
        lastMessageAt: { not: null },
        ...(cursorPayload
          ? {
              OR: [
                { lastMessageAt: { lt: new Date(cursorPayload.lastCreatedAt) } },
                {
                  AND: [
                    { lastMessageAt: new Date(cursorPayload.lastCreatedAt) },
                    { id: { lt: cursorPayload.lastId } },
                  ],
                },
              ],
            }
          : {}),
      },
      include: {
        match: { select: { userAId: true, userBId: true } },
      },
      orderBy: [{ lastMessageAt: 'desc' }, { id: 'desc' }],
      take: PAGE_SIZE + 1,
    });

    const slice = threads.slice(0, PAGE_SIZE);
    const items = await Promise.all(
      slice.map((t) => this.hydrateThreadListItem(userId, t)),
    );

    let nextCursor: string | null = null;
    if (threads.length > PAGE_SIZE) {
      const last = slice[slice.length - 1];
      if (last && last.lastMessageAt) {
        nextCursor = encodeCursor({
          lastId: last.id,
          lastCreatedAt: last.lastMessageAt.toISOString(),
        });
      }
    }

    return { threads: items, nextCursor };
  }

  async getThread(userId: string, threadId: string): Promise<ThreadDetailDto> {
    const thread = await this.prisma.thread.findUnique({
      where: { id: threadId },
      include: {
        match: { select: { userAId: true, userBId: true } },
        anchor: true,
      },
    });
    if (!thread) throw new NotFoundException({ error: 'thread_not_found' });
    this.assertViewerInThread(userId, thread.match);

    const counterpartId = thread.match.userAId === userId ? thread.match.userBId : thread.match.userAId;
    const counterpart = await this.loadCounterpart(counterpartId);

    return {
      threadId: thread.id,
      counterpart,
      anchor: thread.anchor
        ? {
            verseRef: thread.anchor.verseRef,
            verseText: thread.anchor.verseText,
            attribution: thread.anchor.attribution,
          }
        : null,
      lastMessageAt: thread.lastMessageAt?.toISOString() ?? null,
      archivedAt: thread.archivedAt?.toISOString() ?? null,
    };
  }

  async getMessages(
    userId: string,
    threadId: string,
    cursor?: string | null,
  ): Promise<PaginatedMessagesDto> {
    const thread = await this.prisma.thread.findUnique({
      where: { id: threadId },
      include: { match: { select: { userAId: true, userBId: true } } },
    });
    if (!thread) throw new NotFoundException({ error: 'thread_not_found' });
    this.assertViewerInThread(userId, thread.match);

    const cursorPayload = decodeCursor(cursor);
    const rows = await this.prisma.message.findMany({
      where: {
        threadId,
        status: { not: 'blocked' },
        ...(cursorPayload
          ? {
              OR: [
                { createdAt: { lt: new Date(cursorPayload.lastCreatedAt) } },
                {
                  AND: [
                    { createdAt: new Date(cursorPayload.lastCreatedAt) },
                    { id: { lt: cursorPayload.lastId } },
                  ],
                },
              ],
            }
          : {}),
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: PAGE_SIZE + 1,
    });

    const slice = rows.slice(0, PAGE_SIZE);
    let nextCursor: string | null = null;
    if (rows.length > PAGE_SIZE) {
      const last = slice[slice.length - 1];
      if (last) {
        nextCursor = encodeCursor({
          lastId: last.id,
          lastCreatedAt: last.createdAt.toISOString(),
        });
      }
    }

    return { messages: slice.map(toMessageDto), nextCursor };
  }

  // -------------------------------------------------------------------------
  // Send
  // -------------------------------------------------------------------------

  async sendMessage(input: SendMessageInput): Promise<SendMessageResult> {
    const { threadId, senderId, body, kind, verseRef, clientMessageId } = input;

    if (kind === 'verse_share' && !verseRef) {
      throw new BadRequestException({ error: 'verse_ref_required' });
    }

    // 1. Idempotency check — duplicate clientMessageId returns existing row.
    const existing = await this.prisma.message.findUnique({
      where: {
        threadId_clientMessageId: { threadId, clientMessageId },
      },
    });
    if (existing) {
      return { message: toMessageDto(existing), duplicated: true };
    }

    // 2. Verify thread exists + viewer is a participant.
    const thread = await this.prisma.thread.findUnique({
      where: { id: threadId },
      include: { match: { select: { userAId: true, userBId: true } } },
    });
    if (!thread) throw new NotFoundException({ error: 'thread_not_found' });
    this.assertViewerInThread(senderId, thread.match);

    const recipientId =
      thread.match.userAId === senderId ? thread.match.userBId : thread.match.userAId;

    // 3. Block guard — bidirectional. Return 403 with stable error code.
    if (await this.isBlockedEitherWay(senderId, recipientId)) {
      throw new ForbiddenException({ error: 'blocked' });
    }

    // 4. Moderation. We classify body for both text + verse_share kinds; the
    // verseRef itself is structured (e.g. "John 3:16") so it doesn't need
    // its own classification pass.
    const result = await this.textClassifier.classify(body);

    if (result.decision === 'block') {
      throw new ForbiddenException({
        error: 'message_blocked',
        reasons: result.reasons,
      });
    }

    // 5. Persist. `queue` decision (the moderation lib's name for the
    // human-review tier; spec calls it "review") still delivers but is
    // mirrored into ModerationQueueItem for human re-check. Race on the
    // unique key is resolved by re-reading the existing row.
    const persistedStatus = 'delivered' as const;

    let message;
    try {
      message = await this.prisma.message.create({
        data: {
          threadId,
          senderUserId: senderId,
          body,
          kind,
          verseRef: verseRef ?? null,
          clientMessageId,
          status: persistedStatus,
          deliveredAt: new Date(),
        },
      });
    } catch (err: unknown) {
      // Prisma unique-violation race — another concurrent send with same
      // clientMessageId won. Re-read and return that row.
      if (
        err &&
        typeof err === 'object' &&
        'code' in err &&
        (err as { code: string }).code === 'P2002'
      ) {
        const winner = await this.prisma.message.findUnique({
          where: { threadId_clientMessageId: { threadId, clientMessageId } },
        });
        if (winner) return { message: toMessageDto(winner), duplicated: true };
      }
      throw err;
    }

    // 6. Mirror into ModerationQueueItem if the classifier said queue. We
    // persist the Prisma enum value `'review'` for `ModerationDecision`,
    // matching the schema (the moderation lib's `'queue'` decision = our
    // `'review'` queue state).
    if (result.decision === 'queue') {
      await this.prisma.moderationQueueItem
        .create({
          data: {
            kind: 'text_message',
            decision: 'review',
            reasons: result.reasons,
            flags: result.flags,
            rawScores: result.rawScores as object,
            senderUserId: senderId,
            bodyText: body,
            refId: message.id,
          },
        })
        .catch((err: unknown) => {
          // Non-fatal; log + continue. Message is already delivered.
          this.logger.error(
            `moderation queue write failed message=${message.id} err=${(err as Error).message}`,
          );
        });
    }

    // 7. Update Thread.lastMessageAt.
    await this.prisma.thread.update({
      where: { id: threadId },
      data: { lastMessageAt: message.createdAt },
    });

    // 8. Notification + push. Best-effort; never fail the send for this.
    await this.fanoutNotification({
      threadId,
      senderId,
      recipientId,
      preview: previewFor(kind, body),
    }).catch((err: unknown) => {
      this.logger.error(
        `notification fanout failed message=${message.id} err=${(err as Error).message}`,
      );
    });

    return { message: toMessageDto(message), duplicated: false };
  }

  // -------------------------------------------------------------------------
  // Suggestions
  // -------------------------------------------------------------------------

  async getSuggestions(userId: string, threadId: string): Promise<SuggestionDto[]> {
    const thread = await this.prisma.thread.findUnique({
      where: { id: threadId },
      include: { match: { select: { userAId: true, userBId: true } } },
    });
    if (!thread) throw new NotFoundException({ error: 'thread_not_found' });
    this.assertViewerInThread(userId, thread.match);

    // Delegate to verse.service when wired (Lane 2 verse rebuild). Until then,
    // produce three deterministic generic openers so the mobile composer can
    // render. Implementation lives behind a guarded optional call so this
    // service stays compilable while VerseService.suggestionsForThread is in
    // flight.
    const verseAny = this.verse as unknown as {
      suggestionsForThread?: (
        viewerId: string,
        threadId: string,
      ) => Promise<SuggestionDto[]>;
    };
    if (typeof verseAny.suggestionsForThread === 'function') {
      return verseAny.suggestionsForThread(userId, threadId);
    }

    return [
      { id: 'sugg-1', text: 'How did you come to faith?', basedOn: 'generic' },
      { id: 'sugg-2', text: 'What verse has been carrying you this week?', basedOn: 'generic' },
      { id: 'sugg-3', text: 'What is God teaching you lately?', basedOn: 'generic' },
    ];
  }

  // -------------------------------------------------------------------------
  // Archive
  // -------------------------------------------------------------------------

  async archive(userId: string, threadId: string): Promise<{ archivedAt: string }> {
    const thread = await this.prisma.thread.findUnique({
      where: { id: threadId },
      include: { match: { select: { userAId: true, userBId: true } } },
    });
    if (!thread) throw new NotFoundException({ error: 'thread_not_found' });
    this.assertViewerInThread(userId, thread.match);

    const archivedAt = new Date();
    await this.prisma.thread.update({
      where: { id: threadId },
      data: { archivedAt },
    });
    return { archivedAt: archivedAt.toISOString() };
  }

  async unarchive(userId: string, threadId: string): Promise<void> {
    const thread = await this.prisma.thread.findUnique({
      where: { id: threadId },
      include: { match: { select: { userAId: true, userBId: true } } },
    });
    if (!thread) throw new NotFoundException({ error: 'thread_not_found' });
    this.assertViewerInThread(userId, thread.match);

    await this.prisma.thread.update({
      where: { id: threadId },
      data: { archivedAt: null },
    });
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  private assertViewerInThread(
    userId: string,
    match: { userAId: string; userBId: string },
  ): void {
    if (match.userAId !== userId && match.userBId !== userId) {
      throw new ForbiddenException({ error: 'not_thread_participant' });
    }
  }

  private async isBlockedEitherWay(userAId: string, userBId: string): Promise<boolean> {
    if (userAId === userBId) return false;
    const row = await this.prisma.block.findFirst({
      where: {
        OR: [
          { blockerUserId: userAId, blockedUserId: userBId },
          { blockerUserId: userBId, blockedUserId: userAId },
        ],
      },
      select: { blockerUserId: true },
    });
    return !!row;
  }

  private async hydrateThreadListItem(
    viewerId: string,
    thread: {
      id: string;
      lastMessageAt: Date | null;
      match: { userAId: string; userBId: string };
    },
  ): Promise<ThreadListItemDto> {
    const counterpartId =
      thread.match.userAId === viewerId ? thread.match.userBId : thread.match.userAId;
    const [counterpart, lastMessage] = await Promise.all([
      this.loadCounterpart(counterpartId),
      this.prisma.message.findFirst({
        where: { threadId: thread.id, status: { not: 'blocked' } },
        orderBy: { createdAt: 'desc' },
        select: { senderUserId: true, body: true, kind: true, createdAt: true },
      }),
    ]);

    // BLOCKER: schema lacks per-viewer thread-read marker. Until ThreadParticipant
    // (or similar) lands, derive `unread` as "latest message was sent by the
    // counterpart". This will over-report once the user opens the thread, since
    // we have no way to record that they've seen it.
    const unread = !!lastMessage && lastMessage.senderUserId !== viewerId;
    const preview =
      lastMessage == null
        ? null
        : previewFor(lastMessage.kind as 'text' | 'verse_share', lastMessage.body);

    return {
      threadId: thread.id,
      counterpart,
      lastMessageAt: thread.lastMessageAt?.toISOString() ?? null,
      lastMessagePreview: preview,
      unread,
    };
  }

  private async loadCounterpart(userId: string): Promise<CounterpartSummaryDto> {
    const [profile, photo] = await Promise.all([
      this.prisma.profile.findUnique({
        where: { userId },
        select: { displayName: true },
      }),
      this.prisma.photo.findFirst({
        where: { userId, status: 'approved' },
        orderBy: { position: 'asc' },
        select: { storageKey: true },
      }),
    ]);

    return {
      id: userId,
      displayName: profile?.displayName ?? 'Friend',
      avatarUrl: photo?.storageKey ?? null,
    };
  }

  private async fanoutNotification(input: {
    threadId: string;
    senderId: string;
    recipientId: string;
    preview: string;
  }): Promise<void> {
    const senderProfile = await this.prisma.profile.findUnique({
      where: { userId: input.senderId },
      select: { displayName: true },
    });
    const senderName = senderProfile?.displayName ?? 'Someone';

    // NotificationsService.notifyMessage handles in-app row write + push
    // fanout enqueue (BullMQ `push-fanout` queue). Centralized so collapse-id
    // and copy lookup live in one place per Lane D contract.
    await this.notifications.notifyMessage(
      input.recipientId,
      senderName,
      input.threadId,
      input.preview,
    );
  }
}

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

function toMessageDto(row: {
  id: string;
  threadId: string;
  senderUserId: string;
  body: string;
  kind: string;
  verseRef: string | null;
  status: string;
  createdAt: Date;
}): MessageDto {
  return {
    id: row.id,
    threadId: row.threadId,
    senderId: row.senderUserId,
    body: row.body,
    kind: row.kind as 'text' | 'verse_share',
    verseRef: row.verseRef,
    status: row.status as 'delivered' | 'queued' | 'blocked',
    createdAt: row.createdAt.toISOString(),
  };
}

function previewFor(kind: 'text' | 'verse_share', body: string): string {
  if (kind === 'verse_share') {
    return 'Sent a verse';
  }
  return body.length > 120 ? `${body.slice(0, 117)}…` : body;
}
