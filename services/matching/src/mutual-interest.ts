/**
 * Mutual interest gate.
 *
 * Per BLE-8: "Mutual interest required to unlock chat."
 * Per holy guardrails: no monetized urgency, no super-likes.
 *
 * Storage interface is intentionally tiny so the API service can back it
 * with Postgres + a Redis dedup index, while tests use {@link InMemoryInterestStore}.
 */
import type { QuietHoursPredicate } from '@blesscupid/shared';

export type ChatUnlockedAt = string; // ISO timestamp.

export interface InterestStore {
  /** Records that {fromUserId} expressed intent to connect with {toUserId}. */
  expressInterest(fromUserId: string, toUserId: string): Promise<void>;
  hasExpressed(fromUserId: string, toUserId: string): Promise<boolean>;
  /** True iff both users have expressed interest in each other. */
  isMutual(userA: string, userB: string): Promise<boolean>;
  /** Returns ISO timestamp the chat was unlocked, or null if not unlocked. */
  chatUnlockedAt(userA: string, userB: string): Promise<ChatUnlockedAt | null>;
}

/**
 * Reason a push was suppressed (BLE-129). Currently only quiet-hours; chat
 * push (BLE-19) will add `'rate_limited'` and similar.
 */
export type SuppressReason = 'quiet_hours';

export interface NotificationDispatcher {
  /**
   * Fires a push when a user gets a NEW match (mutual interest reached).
   *
   * Implementations MUST honor `quietHours` if it is supplied: when the
   * predicate returns true for `forUserId`, drop the push silently and call
   * {@link onSuppressed} (when set) so analytics can record the miss.
   * Per BLE-129 policy: new-match pushes are dropped, not deferred — one
   * missed match notification is acceptable; chat pushes (BLE-19) defer.
   */
  notifyNewMatch(args: {
    forUserId: string;
    matchedUserId: string;
    occurredAt: ChatUnlockedAt;
  }): Promise<void>;

  /** Optional quiet-hours predicate. When set, gates {@link notifyNewMatch}. */
  readonly quietHours?: QuietHoursPredicate | undefined;

  /**
   * Optional analytics hook fired when a push is suppressed by quiet hours.
   * The matching engine never inspects this; it is invoked by the dispatcher.
   */
  readonly onSuppressed?: ((event: {
    forUserId: string;
    matchedUserId: string;
    occurredAt: ChatUnlockedAt;
    reason: SuppressReason;
  }) => void) | undefined;
}

export interface ExpressInterestResult {
  mutual: boolean;
  chatUnlockedAt: ChatUnlockedAt | null;
}

/**
 * Express interest from `fromUserId` -> `toUserId`. If the other side has
 * already expressed interest, this becomes a mutual match: chat unlocks
 * and both sides get a push.
 *
 * Idempotent: calling twice from the same user yields the same result.
 */
export async function expressInterest(
  fromUserId: string,
  toUserId: string,
  store: InterestStore,
  notifier: NotificationDispatcher,
  now: () => Date = () => new Date(),
): Promise<ExpressInterestResult> {
  if (fromUserId === toUserId) {
    throw new Error("Cannot express interest in self");
  }
  const alreadyForward = await store.hasExpressed(fromUserId, toUserId);
  const reverse = await store.hasExpressed(toUserId, fromUserId);
  const wasMutual = alreadyForward && reverse;

  await store.expressInterest(fromUserId, toUserId);

  if (wasMutual) {
    // Idempotent re-express on an existing match: no renotify.
    const unlockedAt = await store.chatUnlockedAt(fromUserId, toUserId);
    return { mutual: true, chatUnlockedAt: unlockedAt };
  }
  if (!reverse) {
    return { mutual: false, chatUnlockedAt: null };
  }

  let unlockedAt = await store.chatUnlockedAt(fromUserId, toUserId);
  if (!unlockedAt) {
    unlockedAt = now().toISOString();
  }
  await Promise.all([
    notifier.notifyNewMatch({
      forUserId: fromUserId,
      matchedUserId: toUserId,
      occurredAt: unlockedAt,
    }),
    notifier.notifyNewMatch({
      forUserId: toUserId,
      matchedUserId: fromUserId,
      occurredAt: unlockedAt,
    }),
  ]);
  return { mutual: true, chatUnlockedAt: unlockedAt };
}

export async function canChat(
  userA: string,
  userB: string,
  store: InterestStore,
): Promise<boolean> {
  return store.isMutual(userA, userB);
}

/** Reference in-memory store. Used by tests; production uses Postgres. */
export class InMemoryInterestStore implements InterestStore {
  private expressed = new Set<string>();
  private unlockedAt = new Map<string, ChatUnlockedAt>();

  private key(from: string, to: string): string {
    return `${from}->${to}`;
  }
  private pairKey(a: string, b: string): string {
    return [a, b].sort().join("|");
  }

  async expressInterest(fromUserId: string, toUserId: string): Promise<void> {
    this.expressed.add(this.key(fromUserId, toUserId));
    if (await this.isMutual(fromUserId, toUserId)) {
      const pair = this.pairKey(fromUserId, toUserId);
      if (!this.unlockedAt.has(pair)) {
        this.unlockedAt.set(pair, new Date().toISOString());
      }
    }
  }
  async hasExpressed(fromUserId: string, toUserId: string): Promise<boolean> {
    return this.expressed.has(this.key(fromUserId, toUserId));
  }
  async isMutual(a: string, b: string): Promise<boolean> {
    return (
      this.expressed.has(this.key(a, b)) && this.expressed.has(this.key(b, a))
    );
  }
  async chatUnlockedAt(a: string, b: string): Promise<ChatUnlockedAt | null> {
    return this.unlockedAt.get(this.pairKey(a, b)) ?? null;
  }
}

/**
 * Reference notifier that records calls; production wires to APNs/FCM.
 *
 * Honors {@link NotificationDispatcher.quietHours}: when the predicate
 * resolves true for the recipient, the push is suppressed (recorded in
 * {@link suppressed}) and {@link onSuppressed} fires for analytics.
 */
export class RecordingNotifier implements NotificationDispatcher {
  public sent: Array<{
    forUserId: string;
    matchedUserId: string;
    occurredAt: ChatUnlockedAt;
  }> = [];
  public suppressed: Array<{
    forUserId: string;
    matchedUserId: string;
    occurredAt: ChatUnlockedAt;
    reason: SuppressReason;
  }> = [];

  constructor(
    public readonly quietHours?: QuietHoursPredicate,
    public readonly onSuppressed?: NotificationDispatcher['onSuppressed'],
  ) {}

  async notifyNewMatch(args: {
    forUserId: string;
    matchedUserId: string;
    occurredAt: ChatUnlockedAt;
  }): Promise<void> {
    if (this.quietHours && (await this.quietHours(args.forUserId))) {
      const event = { ...args, reason: 'quiet_hours' as const };
      this.suppressed.push(event);
      this.onSuppressed?.(event);
      return;
    }
    this.sent.push(args);
  }
}
