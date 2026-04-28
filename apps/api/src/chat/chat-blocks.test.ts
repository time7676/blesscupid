/**
 * BLE-10 — chat-side bidirectional block enforcement.
 * Verifies ChatService.sendMessage returns `blocked` (and persists nothing)
 * when either party has blocked the other, regardless of who blocked first.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { ChatService } from './chat.service.js';
import type { ChatModerationPipeline } from './moderation-pipeline.provider.js';
import type { PrismaModerationStore } from './prisma-moderation-store.js';

class FakeStore {
  rows = new Set<string>();
  async isBlocked(blockerUserId: string, blockedUserId: string) {
    return this.rows.has(`${blockerUserId}|${blockedUserId}`);
  }
  block(blockerUserId: string, blockedUserId: string) {
    this.rows.add(`${blockerUserId}|${blockedUserId}`);
  }
}

class FakePrisma {
  messages: { id: string }[] = [];
  message = {
    findMany: async () => this.messages,
    create: async () => {
      throw new Error('create should not be called when blocked');
    },
  };
  photo = { findUnique: async () => null };
}

const ALICE = '11111111-1111-1111-1111-111111111111';
const BOB = '22222222-2222-2222-2222-222222222222';
const THREAD = '33333333-3333-3333-3333-333333333333';

const dummyPipeline = {
  moderateMessage: async () => {
    throw new Error('moderation should not run when blocked');
  },
  moderateImage: async () => {
    throw new Error('moderation should not run when blocked');
  },
} as unknown as ChatModerationPipeline;

describe('ChatService — bidirectional block enforcement', () => {
  let prisma: FakePrisma;
  let store: FakeStore;
  let chat: ChatService;

  beforeEach(() => {
    prisma = new FakePrisma();
    store = new FakeStore();
    chat = new ChatService(
      prisma as never,
      dummyPipeline,
      store as unknown as PrismaModerationStore,
    );
  });

  it('returns blocked when sender blocked recipient', async () => {
    store.block(BOB, ALICE);
    const out = await chat.sendMessage(BOB, {
      threadId: THREAD,
      recipientUserId: ALICE,
      text: 'hi',
    });
    expect(out.status).toBe('blocked');
    expect(out.reasons).toContain('recipient_unavailable');
    expect(prisma.messages).toHaveLength(0);
  });

  it('returns blocked when recipient blocked sender (silent block)', async () => {
    store.block(ALICE, BOB);
    const out = await chat.sendMessage(BOB, {
      threadId: THREAD,
      recipientUserId: ALICE,
      text: 'hi',
    });
    expect(out.status).toBe('blocked');
    expect(prisma.messages).toHaveLength(0);
  });

  it('listThreadMessages returns empty when either side has blocked', async () => {
    prisma.messages.push({
      id: 'm1',
      // @ts-expect-error -- minimal row, ChatService selects more fields
      senderUserId: BOB,
      recipientUserId: ALICE,
    });
    store.block(ALICE, BOB);
    const out = await chat.listThreadMessages(BOB, THREAD);
    expect(out).toEqual([]);
  });
});
