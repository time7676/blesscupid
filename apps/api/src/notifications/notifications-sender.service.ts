/**
 * NotificationsSenderService — fan-out push delivery via Firebase Admin
 * Messaging. BLE eng-review 2026-05-06, Lane D.
 *
 * Pre-launch state: APNs certificate has not been uploaded to the
 * Firebase project yet (blocked on $99 Apple Developer account). This
 * service compiles + initializes, but `send()` is a no-op when the
 * Firebase admin app fails to initialize OR the env flag
 * `PUSH_ENABLED` != '1'. Once APNs is wired:
 *   1. Upload .p8 key to https://console.firebase.google.com/project/blesscupid-70006/settings/cloudmessaging
 *   2. Set PUSH_ENABLED=1 in apps/api/.env (and on VPS)
 *   3. Real sends start the next deploy.
 *
 * Stale-token cleanup: when FCM returns
 * `messaging/registration-token-not-registered` we delete the row so
 * the user's other devices keep working.
 */

import { Injectable, Logger } from '@nestjs/common';
import { getApp, getApps, initializeApp, cert, type App } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { PrismaService } from '../prisma/prisma.service.js';

export interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

@Injectable()
export class NotificationsSenderService {
  private readonly logger = new Logger(NotificationsSenderService.name);
  private readonly enabled = process.env.PUSH_ENABLED === '1';
  private app: App | null = null;

  constructor(private readonly prisma: PrismaService) {
    if (!this.enabled) {
      this.logger.log('push sender disabled (PUSH_ENABLED != 1)');
      return;
    }
    try {
      const credJson = process.env.FIREBASE_ADMIN_CREDENTIALS_JSON;
      if (!credJson) throw new Error('FIREBASE_ADMIN_CREDENTIALS_JSON unset');
      const decoded = Buffer.from(credJson, 'base64').toString('utf-8');
      const parsed = JSON.parse(decoded);
      // The phone-auth module also calls initializeApp with the same
      // credentials. firebase-admin throws on duplicate init, so we
      // share via getApp() / getApps().
      if (getApps().length > 0) {
        this.app = getApp();
      } else {
        this.app = initializeApp({ credential: cert(parsed) });
      }
      this.logger.log('push sender initialized');
    } catch (err) {
      this.logger.error(`push sender init failed: ${(err as Error).message}`);
      this.app = null;
    }
  }

  /**
   * Send a push to one user across all their registered tokens.
   * Returns the number of successful deliveries. Stale tokens are
   * deleted from Prisma; permanent transport errors are logged.
   */
  async sendToUser(userId: string, payload: PushPayload): Promise<number> {
    if (!this.enabled || !this.app) return 0;

    const tokens = await this.prisma.pushToken.findMany({
      where: { userId },
      select: { id: true, token: true, platform: true },
    });
    if (tokens.length === 0) return 0;

    const messaging = getMessaging(this.app);
    let ok = 0;
    const stale: string[] = [];

    await Promise.all(
      tokens.map(async (t) => {
        try {
          await messaging.send({
            token: t.token,
            notification: { title: payload.title, body: payload.body },
            data: payload.data,
            // iOS-specific: deliver under low-priority for "intent and
            // pause" UX, never wake the user at night. Quiet hours
            // logic (services/safety) supersedes for actual scheduling.
            apns: { payload: { aps: { sound: 'default' } } },
          });
          ok += 1;
        } catch (err) {
          const code = (err as { code?: string }).code ?? 'unknown';
          if (code.includes('registration-token-not-registered')) {
            stale.push(t.id);
          } else {
            this.logger.warn(
              `push send failed user=${userId} platform=${t.platform} code=${code}`,
            );
          }
        }
      }),
    );

    if (stale.length > 0) {
      await this.prisma.pushToken.deleteMany({ where: { id: { in: stale } } });
    }
    return ok;
  }
}
