/**
 * BLE-10 acceptance: blocks must be bidirectional. Verifies the service
 * writes both rows on `block`, removes both on `unblock`, and that
 * `isBlockedEitherWay` returns true regardless of who initiated.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { BlocksService } from './blocks.service.js';

class FakeStore {
  rows = new Set<string>();
  async block(record: { blockerUserId: string; blockedUserId: string }) {
    this.rows.add(`${record.blockerUserId}|${record.blockedUserId}`);
  }
  async unblock(blockerUserId: string, blockedUserId: string) {
    this.rows.delete(`${blockerUserId}|${blockedUserId}`);
  }
  async isBlocked(blockerUserId: string, blockedUserId: string) {
    return this.rows.has(`${blockerUserId}|${blockedUserId}`);
  }
}

describe('BlocksService — bidirectional', () => {
  let store: FakeStore;
  let svc: BlocksService;
  beforeEach(() => {
    store = new FakeStore();
    svc = new BlocksService(store as never);
  });

  it('block writes both directions', async () => {
    await svc.block('a', 'b');
    expect(store.rows.has('a|b')).toBe(true);
    expect(store.rows.has('b|a')).toBe(true);
  });

  it('unblock removes both directions', async () => {
    await svc.block('a', 'b');
    await svc.unblock('a', 'b');
    expect(store.rows.size).toBe(0);
  });

  it('isBlockedEitherWay true regardless of caller order', async () => {
    await svc.block('a', 'b');
    expect(await svc.isBlockedEitherWay('a', 'b')).toBe(true);
    expect(await svc.isBlockedEitherWay('b', 'a')).toBe(true);
  });

  it('rejects self-blocks', async () => {
    await expect(svc.block('a', 'a')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('returns false when no block exists', async () => {
    expect(await svc.isBlockedEitherWay('a', 'b')).toBe(false);
  });
});
