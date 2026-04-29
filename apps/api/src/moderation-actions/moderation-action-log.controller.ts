// BLE-63 — read-only endpoints for the audit log.
//
// Writes happen from the chat moderation pipeline + reports.service via the
// service directly. Public endpoints are reads only, gated by RolesGuard
// (CEO + Pastor) and further by per-row queue ACL inside the service.

import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { z } from 'zod';
import { JwtAuthGuard, type AuthedRequest } from '../auth/jwt.guard.js';
import { ZodValidate } from '../common/zod.pipe.js';
import { Roles, RolesGuard } from '../common/roles.guard.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ModerationActionLogService } from './moderation-action-log.service.js';
import { QueueAccessDeniedError } from './queue-acl.js';

const ReadEvidenceSchema = z.object({
  reason: z.string().min(1).max(500),
});

@Controller('admin/moderation-actions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('pastor', 'ceo')
export class ModerationActionLogController {
  constructor(
    private readonly service: ModerationActionLogService,
    private readonly prisma: PrismaService,
  ) {}

  @Get(':id')
  async getMetadata(@Req() req: AuthedRequest, @Param('id') id: string) {
    const role = await this.lookupRole(req.user.userId);
    return this.service.getMetadata(id, role);
  }

  @Post(':id/evidence')
  @HttpCode(200)
  async readEvidence(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Body(ZodValidate(ReadEvidenceSchema)) input: z.infer<typeof ReadEvidenceSchema>,
  ) {
    const role = await this.lookupRole(req.user.userId);
    try {
      const plaintext = await this.service.readEvidence(id, {
        readerUserId: req.user.userId,
        readerRole: role,
        reason: input.reason,
      });
      return { evidence: plaintext };
    } catch (err) {
      if (err instanceof QueueAccessDeniedError) {
        throw new ForbiddenException({
          code: 'queue_access_denied',
          queue: err.queue,
        });
      }
      throw err;
    }
  }

  private async lookupRole(userId: string) {
    const u = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (!u) throw new ForbiddenException({ code: 'user_not_found' });
    return u.role;
  }
}
