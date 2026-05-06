import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
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
}
