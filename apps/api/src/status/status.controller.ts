import { Body, Controller, Delete, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { JwtAuthGuard, type AuthedRequest } from '../auth/jwt.guard.js';
import { StatusService } from './status.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

const SetStatusSchema = z.object({
  verseRef: z.string().min(1).max(40),
});

const SuggestQuerySchema = z.object({
  theme: z.string().optional(),
});

@Controller('v1/status')
@UseGuards(JwtAuthGuard)
export class StatusController {
  constructor(
    private readonly status: StatusService,
    private readonly prisma: PrismaService,
  ) {}

  private async resolveLocale(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { localePreference: true },
    });
    return user?.localePreference ?? 'en';
  }

  @Post()
  async set(@Req() req: AuthedRequest, @Body() body: unknown) {
    const parsed = SetStatusSchema.parse(body);
    const locale = await this.resolveLocale(req.user.userId);
    const result = await this.status.set(req.user.userId, parsed.verseRef, locale);
    return { ok: true, status: result };
  }

  @Get('me')
  async getMine(@Req() req: AuthedRequest) {
    const status = await this.status.getMine(req.user.userId);
    return { status };
  }

  @Delete('me')
  async clear(@Req() req: AuthedRequest) {
    await this.status.clear(req.user.userId);
    return { ok: true };
  }

  @Get('user/:userId')
  async getForUser(@Param('userId') userId: string) {
    const status = await this.status.getForUser(userId);
    return { status };
  }

  @Get('suggest')
  async suggest(@Req() req: AuthedRequest, @Query() query: unknown) {
    const parsed = SuggestQuerySchema.parse(query);
    const locale = await this.resolveLocale(req.user.userId);
    return this.status.suggestVerses(req.user.userId, locale, parsed.theme);
  }
}
