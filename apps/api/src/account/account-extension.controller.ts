/**
 * AccountExtensionController — settings PATCH endpoints + minor stubs.
 * Profile + preferences + notifications + privacy + pause.
 *
 * Profile PATCH actually persists to Profile table.
 * Other PATCHes: pre-alpha stubs returning ok=true (real wiring v1.1).
 */

import { Body, Controller, HttpCode, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { JwtAuthGuard, type AuthedRequest } from '../auth/jwt.guard.js';
import { ZodValidate } from '../common/zod.pipe.js';
import { PrismaService } from '../prisma/prisma.service.js';

const ProfilePatchSchema = z.object({
  displayName: z.string().min(1).max(40).optional(),
  bio: z.string().max(280).optional(),
  city: z.string().max(80).optional(),
});

const PreferencesSchema = z.object({
  traditions: z.array(z.string()).optional(),
  ageMin: z.number().int().min(18).max(99).optional(),
  ageMax: z.number().int().min(18).max(99).optional(),
});

const NotificationsSchema = z.object({}).passthrough();
const PrivacySchema = z.object({}).passthrough();
const PauseSchema = z.object({ paused: z.boolean() });

@Controller('me')
@UseGuards(JwtAuthGuard)
export class AccountExtensionController {
  constructor(private readonly prisma: PrismaService) {}

  /** PATCH /me/profile — partial update on Profile. */
  @Patch('profile')
  async patchProfile(
    @Req() req: AuthedRequest,
    @Body(ZodValidate(ProfilePatchSchema)) input: z.infer<typeof ProfilePatchSchema>,
  ) {
    const userId = req.user.userId;
    const data: Record<string, unknown> = {};
    if (input.displayName !== undefined) data.displayName = input.displayName;
    if (input.bio !== undefined) {
      data.bio = input.bio;
      // Bio re-edit goes back through moderation — pre-alpha auto-approve.
      data.bioApproved = true;
    }
    if (input.city !== undefined) data.city = input.city;
    if (Object.keys(data).length === 0) return { ok: true };

    const updated = await this.prisma.profile.update({
      where: { userId },
      data,
      select: { displayName: true, bio: true, city: true },
    });
    return { ok: true, profile: updated };
  }

  /** PATCH /me/preferences — pre-alpha stub. */
  @Patch('preferences')
  @HttpCode(200)
  async patchPreferences(
    @Req() req: AuthedRequest,
    @Body(ZodValidate(PreferencesSchema)) input: z.infer<typeof PreferencesSchema>,
  ) {
    void req;
    void input;
    return { ok: true };
  }

  /** PATCH /me/notifications — pre-alpha stub. */
  @Patch('notifications')
  @HttpCode(200)
  async patchNotifications(@Body(ZodValidate(NotificationsSchema)) input: Record<string, unknown>) {
    void input;
    return { ok: true };
  }

  /** PATCH /me/privacy — pre-alpha stub. */
  @Patch('privacy')
  @HttpCode(200)
  async patchPrivacy(@Body(ZodValidate(PrivacySchema)) input: Record<string, unknown>) {
    void input;
    return { ok: true };
  }

  /** POST /me/pause — pre-alpha stub. v1.1 toggles Profile.paused field. */
  @Post('pause')
  @HttpCode(200)
  async pauseProfile(
    @Req() req: AuthedRequest,
    @Body(ZodValidate(PauseSchema)) input: z.infer<typeof PauseSchema>,
  ) {
    void req;
    void input;
    return { ok: true };
  }
}
