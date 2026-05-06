/**
 * Deep-link target taxonomy for push + in-app feed routing.
 *
 * Every Notification row's `payload.deepLink` carries a serialized form
 * (`today`, `thread:abc`, `profile:xyz`, …). The mobile push handler /
 * NotificationsSheet decodes back to a typed target via React Navigation
 * `linking` config (see plan §1184).
 *
 * Keep this module dependency-free so it can be re-imported on the
 * mobile side without dragging the API graph along.
 */

export type DeepLinkTarget =
  | { kind: 'today' }
  | { kind: 'matches' }
  | { kind: 'thread'; threadId: string }
  | { kind: 'profile'; userId: string }
  | { kind: 'verify' }
  | { kind: 'upgrade' }
  | { kind: 'status' };

export function serializeDeepLink(t: DeepLinkTarget): string {
  switch (t.kind) {
    case 'today':
    case 'matches':
    case 'verify':
    case 'upgrade':
    case 'status':
      return t.kind;
    case 'thread':
      return `thread:${t.threadId}`;
    case 'profile':
      return `profile:${t.userId}`;
  }
}

export function parseDeepLink(s: string): DeepLinkTarget | null {
  if (s === 'today' || s === 'matches' || s === 'verify' || s === 'upgrade' || s === 'status') {
    return { kind: s };
  }
  const [prefix, ...rest] = s.split(':');
  const id = rest.join(':');
  if (!id) return null;
  if (prefix === 'thread') return { kind: 'thread', threadId: id };
  if (prefix === 'profile') return { kind: 'profile', userId: id };
  return null;
}
