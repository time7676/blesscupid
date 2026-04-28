import {
  Body,
  Controller,
  Delete,
  HttpCode,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { z } from 'zod';
import { JwtAuthGuard, type AuthedRequest } from '../auth/jwt.guard.js';
import { ZodValidate } from '../common/zod.pipe.js';
import { AccountDeletionService } from './account-deletion.service.js';

const DeleteMeSchema = z.object({
  expedited: z.boolean().optional(),
});

@Controller('me')
@UseGuards(JwtAuthGuard)
export class AccountController {
  constructor(private readonly deletion: AccountDeletionService) {}

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
