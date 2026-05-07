import {
  Body,
  Controller,
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
import { AdminGuard } from '../verification/admin.guard.js';
import { ModerationQueueService } from './moderation-queue.service.js';

/**
 * Admin moderation-queue surface. Admin-role-gated.
 *
 *   GET  /v1/admin/moderation-queue?cursor=&limit=50&decision=review|block
 *   POST /v1/admin/moderation-queue/:id/resolve  { resolution, notes? }
 */
const ResolveSchema = z.object({
  resolution: z.enum(['approved', 'rejected']),
  notes: z.string().max(2000).optional(),
});

const DecisionFilter = z.enum(['allow', 'review', 'block']);

@Controller('v1/admin/moderation-queue')
@UseGuards(JwtAuthGuard, AdminGuard)
export class ModerationQueueController {
  constructor(private readonly queue: ModerationQueueService) {}

  @Get()
  async list(
    @Query('cursor') cursor?: string,
    @Query('limit') limitRaw?: string,
    @Query('decision') decisionRaw?: string,
  ) {
    const n = limitRaw ? Math.min(Number(limitRaw), 200) : 50;
    const decision = decisionRaw ? DecisionFilter.parse(decisionRaw) : undefined;
    return this.queue.listPending({
      ...(cursor ? { cursor } : {}),
      limit: Number.isFinite(n) ? n : 50,
      ...(decision ? { decision } : {}),
    });
  }

  @Post(':id/resolve')
  @HttpCode(200)
  async resolve(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Body(ZodValidate(ResolveSchema)) input: z.infer<typeof ResolveSchema>,
  ) {
    return this.queue.resolve(id, input.resolution, req.user.userId, input.notes);
  }
}
