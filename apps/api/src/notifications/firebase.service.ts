/**
 * FirebaseService — singleton wrapper around firebase-admin Messaging.
 *
 * Boots once at module init from `FIREBASE_SERVICE_ACCOUNT_KEY`
 * (base64-encoded JSON, same shape as auth-side
 * `FIREBASE_ADMIN_CREDENTIALS_JSON`; we accept either env var so the
 * v1-restart move-over doesn't need ops to re-deploy secrets).
 *
 * Behaves as a no-op (logs only) when `PUSH_ENABLED !== '1'` OR no
 * credentials are configured. This keeps dev + APNs-blocked pre-launch
 * working without throwing at boot.
 *
 * BLE eng-review 2026-05-06, Lane D notifications.
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  cert,
  getApp,
  getApps,
  initializeApp,
  type App,
} from 'firebase-admin/app';
import { getMessaging, type Message } from 'firebase-admin/messaging';

export type PushSendResult =
  | { ok: true; messageId: string }
  | { ok: false; code: string; retriable: boolean };

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);
  private readonly enabled = process.env.PUSH_ENABLED === '1';
  private app: App | null = null;

  onModuleInit(): void {
    if (!this.enabled) {
      this.logger.log('firebase push disabled (PUSH_ENABLED != 1) — log-only mode');
      return;
    }
    const credJson =
      process.env.FIREBASE_SERVICE_ACCOUNT_KEY ??
      process.env.FIREBASE_ADMIN_CREDENTIALS_JSON;
    if (!credJson) {
      this.logger.warn(
        'firebase credentials missing (FIREBASE_SERVICE_ACCOUNT_KEY) — log-only mode',
      );
      return;
    }
    try {
      const decoded = Buffer.from(credJson, 'base64').toString('utf-8');
      const parsed = JSON.parse(decoded);
      // The auth (phone-auth) module also calls initializeApp with the
      // same credentials. firebase-admin throws on duplicate init — share.
      this.app = getApps().length > 0 ? getApp() : initializeApp({ credential: cert(parsed) });
      this.logger.log('firebase admin initialized');
    } catch (err) {
      this.logger.error(`firebase init failed: ${(err as Error).message}`);
      this.app = null;
    }
  }

  /**
   * Whether real send is wired. Caller may decide to skip work
   * (e.g. unread-row-only flow) when false, or just call sendToToken
   * which will log + return ok.
   */
  isLive(): boolean {
    return this.enabled && this.app !== null;
  }

  /**
   * Single-token send. The push-fanout processor calls this per token
   * concurrently. Returns a typed result the processor uses to decide
   * stale-token cleanup.
   */
  async sendToToken(token: string, message: Omit<Message, 'token'>): Promise<PushSendResult> {
    if (!this.isLive() || !this.app) {
      this.logger.debug(`[push log-only] token=${token.slice(0, 8)}… msg=${JSON.stringify(message).slice(0, 200)}`);
      return { ok: true, messageId: 'log-only' };
    }
    try {
      const messageId = await getMessaging(this.app).send({ ...message, token });
      return { ok: true, messageId };
    } catch (err) {
      const code = (err as { code?: string }).code ?? 'unknown';
      const retriable =
        code.includes('internal-error') ||
        code.includes('server-unavailable') ||
        code.includes('quota-exceeded');
      return { ok: false, code, retriable };
    }
  }
}
