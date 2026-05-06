import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { z } from 'zod';
import { JwtAuthGuard, type AuthedRequest } from '../auth/jwt.guard.js';
import { ZodValidate } from '../common/zod.pipe.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { AccountDeletionService } from './account-deletion.service.js';

const DeleteMeSchema = z.object({
  expedited: z.boolean().optional(),
});

const PushTokenSchema = z.object({
  token: z.string().min(1).max(4096),
  platform: z.enum(['ios', 'android', 'web']),
  appVersion: z.string().max(40).optional(),
});

@Controller('me')
@UseGuards(JwtAuthGuard)
export class AccountController {
  constructor(
    private readonly deletion: AccountDeletionService,
    private readonly prisma: PrismaService,
  ) {}

  // BLE eng-review 2026-05-06 — server-side hydration for mobile boot.
  // Mobile auth-store calls this after every cold start to learn whether
  // onboarding is complete (so reinstall doesn't force a redo) and to
  // populate the local cache. NEVER returns legalName — that field is PII
  // gated behind /v1/admin and /v1/safety routes.
  @Get()
  async getMe(@Req() req: AuthedRequest) {
    const user = await this.prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        onboardingCompleted: true,
        profile: {
          select: {
            displayName: true,
            gender: true,
            city: true,
            countryCode: true,
            onboardingStep: true,
            bio: true,
            bioApproved: true,
          },
        },
      },
    });
    if (!user) throw new NotFoundException('user_not_found');
    return user;
  }

  /**
   * `DELETE /me` — soft-deletes the calling user and schedules hard delete
   * in 30 days (or 0 days if `expedited`, for CCPA right-to-immediate).
   */
  @Delete()
  @HttpCode(202)
  async deleteMe(
    @Req() req: AuthedRequest,
    @Body(ZodValidate(DeleteMeSchema)) body: z.infer<typeof DeleteMeSchema>,
  ) {
    return this.deletion.requestDeletion(req.user.userId, {
      expedited: body.expedited ?? false,
    });
  }

  /** `POST /me/restore` — undo a pending soft-delete within the hold window. */
  @Post('restore')
  async restoreMe(@Req() req: AuthedRequest) {
    const ok = await this.deletion.cancelDeletion(req.user.userId);
    return { ok };
  }

  /**
   * `GET /me/export` — UU PDP Pasal 11 right to data portability.
   * Returns a JSON snapshot of every field tied to this user that is
   * not derivative of another user's data. Format = JSON; the user can
   * pipe to disk via the mobile UI (Settings → Privacy → Export my data).
   *
   * Per UU PDP Pasal 9, the response must arrive within 3×24 hours;
   * since this endpoint is synchronous and small (one user's rows are
   * O(KB), not O(MB) at v1 scale), we return inline with a 200 OK.
   *
   * Excluded by design: other users' messages addressed to this user
   * (those are the senders' personal data, not yours), moderation
   * decisions made by reviewers (operational records), audit logs.
   */
  @Get('export')
  async exportMe(@Req() req: AuthedRequest) {
    const userId = req.user.userId;
    const [user, sessions, photos, decisions, sentMessages] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          profile: true,
          faithProfile: true,
          covenants: true,
          oauthAccounts: { select: { provider: true, createdAt: true } },
        },
      }),
      this.prisma.session.findMany({
        where: { userId },
        select: { id: true, userAgent: true, ip: true, createdAt: true, revokedAt: true },
      }),
      this.prisma.photo.findMany({
        where: { userId },
        select: {
          id: true,
          position: true,
          status: true,
          storageKey: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.matchDecision.findMany({
        where: { userId },
        select: {
          candidateUserId: true,
          decision: true,
          day: true,
          createdAt: true,
        },
      }),
      this.prisma.message.findMany({
        where: { senderUserId: userId },
        select: {
          id: true,
          threadId: true,
          recipientUserId: true,
          createdAt: true,
          status: true,
          // Body is your own content — you sent it, you can export it.
          body: true,
        },
        take: 5000,
      }),
    ]);
    if (!user) throw new NotFoundException('user_not_found');
    return {
      exportedAt: new Date().toISOString(),
      uuPdpClause: 'Pasal 11 (right to data portability)',
      user,
      sessions,
      photos,
      matchDecisions: decisions,
      sentMessages,
    };
  }

  /**
   * `POST /me/push-token` — register an FCM/APNs device token for push.
   * Idempotent on (userId, token); re-registering same token bumps
   * `lastSeenAt`. Mobile calls this after permission grant + on every
   * cold boot. Backend dedupes + the notifications service deletes
   * stale tokens reported by FCM as not-registered.
   *
   * BLE eng-review 2026-05-06 — Lane D scaffold. Token routing to
   * APNs (iOS) / FCM (Android) is handled by firebase-admin Messaging
   * once the APNs certificate is uploaded to the Firebase project.
   * Until the paid Apple Dev account is provisioned, iOS tokens are
   * stored but `notifications-sender.service.ts` no-ops on send.
   */
  @Post('push-token')
  @HttpCode(200)
  async registerPushToken(
    @Req() req: AuthedRequest,
    @Body(ZodValidate(PushTokenSchema)) body: z.infer<typeof PushTokenSchema>,
  ) {
    await this.prisma.pushToken.upsert({
      where: {
        userId_token: { userId: req.user.userId, token: body.token },
      },
      create: {
        userId: req.user.userId,
        token: body.token,
        platform: body.platform,
        appVersion: body.appVersion,
      },
      update: {
        platform: body.platform,
        appVersion: body.appVersion,
        lastSeenAt: new Date(),
      },
    });
    return { ok: true };
  }

  /**
   * `DELETE /me/push-token/:token` — explicit unregister, e.g. on
   * logout or notification-permission revoke.
   */
  @Delete('push-token/:token')
  @HttpCode(204)
  async unregisterPushToken(
    @Req() req: AuthedRequest,
    @Param('token') token: string,
  ) {
    await this.prisma.pushToken.deleteMany({
      where: { userId: req.user.userId, token },
    });
  }
}
