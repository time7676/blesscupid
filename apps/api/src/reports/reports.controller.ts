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
import { ReportsService } from './reports.service.js';

/**
 * Reports controller — v1-restart.
 *
 * Public endpoints (JWT-gated):
 *   POST /v1/reports                    — file a report on another user
 *
 * Admin-only endpoints (JWT + AdminGuard, role=admin):
 *   GET  /v1/admin/reports              — cursor-paginated open report list
 *   POST /v1/admin/reports/:id/resolve  — resolve a report w/ optional action
 */
const ReportReasonSchema = z.enum([
  'sexual_content',
  'harassment',
  'fake_profile',
  'underage',
  'hate_or_harassment',
  'self_harm_or_crisis',
  'spam',
  'other',
]);

const CreateReportSchema = z.object({
  reportedUserId: z.string().uuid(),
  reason: ReportReasonSchema,
  detail: z.string().max(2000).optional(),
  threadId: z.string().uuid().optional(),
  messageId: z.string().uuid().optional(),
  autoBlock: z.boolean().optional(),
});

const ResolveSchema = z.object({
  resolution: z.string().min(1).max(2000),
  action: z.enum(['dismiss', 'warn', 'suspend7d', 'ban']).optional(),
});

@Controller()
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Post('v1/reports')
  @HttpCode(201)
  @UseGuards(JwtAuthGuard)
  async create(
    @Req() req: AuthedRequest,
    @Body(ZodValidate(CreateReportSchema)) input: z.infer<typeof CreateReportSchema>,
  ) {
    return this.reports.create(req.user.userId, input);
  }

  @Get('v1/admin/reports')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async list(
    @Query('cursor') cursor?: string,
    @Query('limit') limitRaw?: string,
  ) {
    const limit = limitRaw ? Math.min(Number(limitRaw), 200) : 50;
    return this.reports.listOpen({
      ...(cursor ? { cursor } : {}),
      limit: Number.isFinite(limit) ? limit : 50,
    });
  }

  @Post('v1/admin/reports/:id/resolve')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard, AdminGuard)
  async resolve(
    @Req() req: AuthedRequest,
    @Param('id') reportId: string,
    @Body(ZodValidate(ResolveSchema)) body: z.infer<typeof ResolveSchema>,
  ) {
    return this.reports.resolve({
      reportId,
      actorUserId: req.user.userId,
      resolution: body.resolution,
      ...(body.action ? { action: body.action } : {}),
    });
  }
}
