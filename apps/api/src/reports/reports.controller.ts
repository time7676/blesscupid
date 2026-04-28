import { Body, Controller, Get, HttpCode, Post, Req, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { JwtAuthGuard, type AuthedRequest } from '../auth/jwt.guard.js';
import { ZodValidate } from '../common/zod.pipe.js';
import { Roles, RolesGuard } from '../common/roles.guard.js';
import { ReportsService } from './reports.service.js';

const ReportReasonSchema = z.enum([
  'sexual_content',
  'harassment',
  'off_platform_pressure',
  'scam_or_spam',
  'underage',
  'fake_profile',
  'other',
]);

const CreateReportSchema = z.object({
  reportedUserId: z.string().uuid(),
  reason: ReportReasonSchema,
  threadId: z.string().uuid().optional(),
  messageId: z.string().uuid().optional(),
  freeform: z.string().max(1000).optional(),
});

@Controller()
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Post('reports')
  @HttpCode(201)
  async create(
    @Req() req: AuthedRequest,
    @Body(ZodValidate(CreateReportSchema)) input: z.infer<typeof CreateReportSchema>,
  ) {
    return this.reports.create(req.user.userId, input);
  }

  @Get('admin/reports')
  @UseGuards(RolesGuard)
  @Roles('pastor', 'ceo')
  async listAll() {
    return this.reports.listAll();
  }

  /**
   * T&S triage queue. Severity desc, age asc. Pastor + CEO only.
   */
  @Get('admin/safety/queue')
  @UseGuards(RolesGuard)
  @Roles('pastor', 'ceo')
  async triageQueue() {
    return this.reports.listTriageQueue();
  }
}
