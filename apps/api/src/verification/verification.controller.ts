import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { JwtAuthGuard, type AuthedRequest } from '../auth/jwt.guard.js';
import { AdminGuard } from './admin.guard.js';
import { VerificationService } from './verification.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

const SubmitSchema = z.object({
  selfieKey: z.string().min(1).max(500),
});

const RejectSchema = z.object({
  reason: z.string().min(1).max(200),
});

@Controller('v1/verification')
@UseGuards(JwtAuthGuard)
export class VerificationController {
  constructor(
    private readonly verification: VerificationService,
    private readonly prisma: PrismaService,
  ) {}

  private async resolveLocale(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { localePreference: true },
    });
    return user?.localePreference ?? 'en';
  }

  @Post('submit')
  async submit(@Req() req: AuthedRequest, @Body() body: unknown) {
    const parsed = SubmitSchema.parse(body);
    const locale = await this.resolveLocale(req.user.userId);
    return this.verification.submit(req.user.userId, parsed.selfieKey, locale);
  }

  @Get('me')
  async myStatus(@Req() req: AuthedRequest) {
    return this.verification.getMyStatus(req.user.userId);
  }
}

@Controller('v1/admin/verification')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminVerificationController {
  constructor(private readonly verification: VerificationService) {}

  @Get('queue')
  async queue(@Query('limit') limit?: string) {
    return this.verification.listPendingForAdmin(limit ? Math.min(Number(limit), 200) : 50);
  }

  @Post(':id/approve')
  async approve(@Param('id') id: string) {
    await this.verification.approve(id, null);
    return { ok: true };
  }

  @Post(':id/reject')
  async reject(@Req() req: AuthedRequest, @Param('id') id: string, @Body() body: unknown) {
    const parsed = RejectSchema.parse(body);
    await this.verification.reject(id, parsed.reason, req.user.userId);
    return { ok: true };
  }

  @Post('revoke/:userId')
  async revoke(@Req() req: AuthedRequest, @Param('userId') userId: string) {
    await this.verification.revoke(userId, req.user.userId);
    return { ok: true };
  }
}
