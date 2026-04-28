import { Body, Controller, Get, HttpCode, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { JwtAuthGuard, type AuthedRequest } from '../auth/jwt.guard.js';
import { ZodValidate } from '../common/zod.pipe.js';
import { Roles, RolesGuard } from '../common/roles.guard.js';
import { ModerationQueueService } from './moderation-queue.service.js';

const ResolveSchema = z.object({
  action: z.enum(['approve', 'reject']),
  note: z.string().max(1000).optional(),
});

@Controller('admin/moderation-queue')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('pastor', 'ceo')
export class ModerationQueueController {
  constructor(private readonly queue: ModerationQueueService) {}

  @Get()
  async list(@Query('limit') limit?: string) {
    const n = limit ? Math.min(Number(limit), 200) : 50;
    return this.queue.listPending(Number.isFinite(n) ? n : 50);
  }

  @Post(':id/resolve')
  @HttpCode(200)
  async resolve(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Body(ZodValidate(ResolveSchema)) input: z.infer<typeof ResolveSchema>,
  ) {
    return this.queue.resolve(id, input.action, req.user.userId, input.note);
  }
}
