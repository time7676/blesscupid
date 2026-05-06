/**
 * NotificationsController — `/v1/me/notifications` + `/v1/me/push-token`.
 *
 * Routes
 *   GET  /v1/me/notifications?cursor=&limit=20  → cursor-paginated feed
 *   POST /v1/me/notifications/:id/read          → mark single read
 *   POST /v1/me/notifications/read-all          → mark all unread read
 *   POST /v1/me/push-token                      → upsert FCM token
 *   DELETE /v1/me/push-token/:token             → unregister
 *
 * All routes require Bearer auth via JwtAuthGuard. Userid comes from the
 * JWT — no `userId` in path/body to avoid impersonation.
 *
 * BLE eng-review 2026-05-06, Lane D.
 */

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { z } from 'zod';
import { JwtAuthGuard, type AuthedRequest } from '../auth/jwt.guard.js';
import { ZodValidate } from '../common/zod.pipe.js';
import { DEFAULT_LIST_LIMIT, NotificationsService } from './notifications.service.js';

const ListQuerySchema = z.object({
  cursor: z.string().min(1).max(512).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

const RegisterPushTokenSchema = z.object({
  token: z.string().min(8).max(4096),
  platform: z.enum(['ios', 'android', 'web']),
  appVersion: z.string().min(1).max(64).optional(),
});

@Controller('v1/me')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get('notifications')
  async list(
    @Req() req: AuthedRequest,
    @Query(ZodValidate(ListQuerySchema)) query: z.infer<typeof ListQuerySchema>,
  ) {
    return this.notifications.list(
      req.user.userId,
      query.cursor ?? null,
      query.limit ?? DEFAULT_LIST_LIMIT,
    );
  }

  @Post('notifications/:id/read')
  @HttpCode(200)
  async markRead(@Req() req: AuthedRequest, @Param('id') id: string) {
    return this.notifications.markRead(id, req.user.userId);
  }

  @Post('notifications/read-all')
  @HttpCode(200)
  async markAllRead(@Req() req: AuthedRequest) {
    return this.notifications.markAllRead(req.user.userId);
  }

  @Post('push-token')
  @HttpCode(200)
  async registerPushToken(
    @Req() req: AuthedRequest,
    @Body(ZodValidate(RegisterPushTokenSchema)) body: z.infer<typeof RegisterPushTokenSchema>,
  ) {
    return this.notifications.upsertPushToken({
      userId: req.user.userId,
      token: body.token,
      platform: body.platform,
      ...(body.appVersion ? { appVersion: body.appVersion } : {}),
    });
  }

  @Delete('push-token/:token')
  @HttpCode(200)
  async unregisterPushToken(@Req() req: AuthedRequest, @Param('token') token: string) {
    return this.notifications.deletePushToken(req.user.userId, token);
  }
}
