/**
 * AccountController — `/v1/me/*` self-service endpoints (auth-required).
 *
 * Surface (v1-restart):
 *   GET    /v1/me                  — User + Profile + activity counts
 *   PATCH  /v1/me/profile          — partial Profile update; invalidates deck
 *                                    cache when matching-relevant fields change
 *   PATCH  /v1/me/preferences      — STUB; v1.1 introduces a Preferences table.
 *                                    Schema today has no ageRangeMin etc.
 *   PATCH  /v1/me/privacy          — Profile.hideFromUnverified
 *   PATCH  /v1/me/notifications    — STUB; v1.1 introduces a NotificationPref
 *                                    table. Schema today has no per-channel
 *                                    enable flags on User/Profile.
 *   POST   /v1/me/pause            — Profile.pausedUntil
 *   DELETE /v1/me/pause            — clear pausedUntil
 *   DELETE /v1/me                  — soft-delete (User.deletedAt = now);
 *                                    confirmText must equal "DELETE"
 *   POST   /v1/me/restore          — clear deletedAt within 30d or 403
 *   GET    /v1/me/export           — UU PDP Pasal 11 JSON dump (inline at v1)
 *
 * Push-token registration is now owned by NotificationsController; the legacy
 * `/me/push-token` route was retired together with the AccountDeletionRequest
 * table in BLE-160.
 */
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { z } from 'zod';
import { JwtAuthGuard, type AuthedRequest } from '../auth/jwt.guard.js';
import { ZodValidate } from '../common/zod.pipe.js';
import { AccountService } from './account.service.js';

const TraditionEnum = z.enum(['catholic', 'protestant', 'orthodox', 'nondenom', 'other']);
const WalkStageEnum = z.enum(['seeking', 'growing', 'rooted']);
const MarriageIntentEnum = z.enum(['yes', 'maybe', 'no']);

const ProfilePatchSchema = z.object({
  displayName: z.string().min(1).max(40).optional(),
  bio: z.string().max(280).optional(),
  tradition: TraditionEnum.optional(),
  walkStage: WalkStageEnum.optional(),
  marriageIntent: MarriageIntentEnum.optional(),
  city: z.string().max(80).optional(),
  homeChurchName: z.string().max(120).nullable().optional(),
});

const PreferencesSchema = z.object({
  ageRangeMin: z.number().int().min(18).max(99).optional(),
  ageRangeMax: z.number().int().min(18).max(99).optional(),
  distanceKm: z.number().int().min(1).max(20_000).optional(),
  traditionFilter: z.array(TraditionEnum).optional(),
});

const PrivacySchema = z.object({
  hideFromUnverified: z.boolean().optional(),
});

const NotificationsSchema = z.object({
  matchesEnabled: z.boolean().optional(),
  messagesEnabled: z.boolean().optional(),
});

const PauseSchema = z.object({
  duration: z.enum(['1d', '1w', 'indefinite']),
});

const DeleteMeSchema = z.object({
  confirmText: z.literal('DELETE'),
});

@Controller({ path: 'me', version: '1' })
@UseGuards(JwtAuthGuard)
export class AccountController {
  constructor(private readonly account: AccountService) {}

  @Get()
  getMe(@Req() req: AuthedRequest) {
    return this.account.getMe(req.user.userId);
  }

  @Patch('profile')
  patchProfile(
    @Req() req: AuthedRequest,
    @Body(ZodValidate(ProfilePatchSchema)) body: z.infer<typeof ProfilePatchSchema>,
  ) {
    return this.account.updateProfile(req.user.userId, body);
  }

  /**
   * PATCH /v1/me/preferences — STUB.
   *
   * The current schema has no Preferences table and no ageRange/distance
   * columns on User or Profile. v1.1 plan = introduce a `Preferences` model.
   * Until then this endpoint accepts the shape and returns 200 so the mobile
   * Settings screen has a stable API to bind to.
   */
  @Patch('preferences')
  @HttpCode(200)
  patchPreferences(
    @Req() req: AuthedRequest,
    @Body(ZodValidate(PreferencesSchema)) body: z.infer<typeof PreferencesSchema>,
  ) {
    void req;
    void body;
    // TODO(v1.1): persist to Preferences table, then call MatchingService.invalidateCache.
    return { ok: true, persisted: false };
  }

  @Patch('privacy')
  patchPrivacy(
    @Req() req: AuthedRequest,
    @Body(ZodValidate(PrivacySchema)) body: z.infer<typeof PrivacySchema>,
  ) {
    return this.account.updatePrivacy(req.user.userId, body);
  }

  /**
   * PATCH /v1/me/notifications — STUB.
   *
   * No per-channel enable column on User/Profile yet; v1.1 introduces a
   * NotificationPref table. Endpoint exists so mobile can bind a real route.
   */
  @Patch('notifications')
  @HttpCode(200)
  patchNotifications(
    @Req() req: AuthedRequest,
    @Body(ZodValidate(NotificationsSchema)) body: z.infer<typeof NotificationsSchema>,
  ) {
    void req;
    void body;
    // TODO(v1.1): persist to NotificationPref table.
    return { ok: true, persisted: false };
  }

  @Post('pause')
  pauseMe(
    @Req() req: AuthedRequest,
    @Body(ZodValidate(PauseSchema)) body: z.infer<typeof PauseSchema>,
  ) {
    return this.account.pauseProfile(req.user.userId, body.duration);
  }

  @Delete('pause')
  unpauseMe(@Req() req: AuthedRequest) {
    return this.account.unpauseProfile(req.user.userId);
  }

  @Delete()
  @HttpCode(202)
  async deleteMe(
    @Req() req: AuthedRequest,
    @Body(ZodValidate(DeleteMeSchema)) body: z.infer<typeof DeleteMeSchema>,
  ) {
    if (body.confirmText !== 'DELETE') {
      throw new BadRequestException({ code: 'confirm_text_mismatch' });
    }
    return this.account.softDelete(req.user.userId);
  }

  @Post('restore')
  restoreMe(@Req() req: AuthedRequest) {
    return this.account.restore(req.user.userId);
  }

  @Get('export')
  exportMe(@Req() req: AuthedRequest) {
    return this.account.exportData(req.user.userId);
  }
}
