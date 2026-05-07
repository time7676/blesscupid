/**
 * WaitlistController — public, no auth. Captures pre-launch waitlist
 * signups from blesscupid.com.
 *
 * BLE 2026-05-06. Rate-limited via the global ThrottlerGuard
 * (60 req/min per IP, configured in app.module.ts) plus a tighter
 * per-IP cap on this specific route to slow bot signups.
 *
 * UU PDP Pasal 20 — `consent` boolean must be true. We store
 * `consentedAt` as the explicit consent timestamp.
 */

import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { z } from 'zod';
import { ZodValidate } from '../common/zod.pipe.js';
import { JwtAuthGuard, type AuthedRequest } from '../auth/jwt.guard.js';
import { AdminGuard } from '../verification/admin.guard.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { createHash } from 'node:crypto';

const WAITLIST_INTENTS = [
  'dating_marriage',
  'christian_friends',
  'christian_community',
  'exploring',
] as const;

const WaitlistSubmitSchema = z.object({
  email: z.string().email().max(254),
  intent: z.enum(WAITLIST_INTENTS),
  city: z.string().min(1).max(80).optional(),
  locale: z.enum(['id', 'en']).default('id'),
  source: z.string().max(60).optional(),
  consent: z.literal(true),
  utmCampaign: z.string().max(60).optional(),
  utmSource: z.string().max(60).optional(),
  utmMedium: z.string().max(60).optional(),
});

@Controller('waitlist')
export class WaitlistController {
  constructor(private readonly prisma: PrismaService) {}

  // 5 signups per IP per hour. Tight enough to block scripted spam,
  // loose enough that a parish leader sharing a tablet can submit a
  // few in a row without tripping. Override the global 60/min limit.
  @Post()
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60 * 60 * 1000 } })
  async submit(
    @Body(ZodValidate(WaitlistSubmitSchema)) body: z.infer<typeof WaitlistSubmitSchema>,
    @Req() req: { ip?: string; headers: Record<string, string | string[] | undefined> },
  ) {
    const email = body.email.trim().toLowerCase();
    const ip = req.ip ?? null;
    const ipHash = ip ? createHash('sha256').update(ip).digest('hex') : null;
    const ua = (req.headers['user-agent'] as string | undefined) ?? null;
    // `body.source` is captured on the wire but not persisted — schema has
    // no `source` column. UTM fields cover attribution; drop `source` if
    // we ever need it back, add a column.
    try {
      const row = await this.prisma.waitlist.upsert({
        where: { email },
        create: {
          email,
          intent: body.intent,
          city: body.city ?? null,
          locale: body.locale,
          consentedAt: new Date(),
          ipHash,
          userAgent: ua,
          utmCampaign: body.utmCampaign ?? null,
          utmSource: body.utmSource ?? null,
          utmMedium: body.utmMedium ?? null,
        },
        update: {
          intent: body.intent,
          city: body.city ?? null,
          locale: body.locale,
          consentedAt: new Date(),
          // Don't overwrite UTM on resubmit so the original
          // attribution is preserved. Just bump the consent timestamp.
        },
        select: { id: true, status: true },
      });
      return { ok: true, status: row.status };
    } catch (err) {
      throw new BadRequestException({
        code: 'waitlist_save_failed',
        message: 'Could not save your signup. Try again in a moment.',
      });
    }
  }

  // Admin-only CSV export for invite-wave email blasts. JWT + AdminGuard
  // (role=admin per User.role enum). v1-restart collapsed the legacy
  // pastor/ceo roles into a single `admin` role.
  @Get('admin.csv')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="blesscupid-waitlist.csv"')
  async exportCsv(
    @Req() _req: AuthedRequest,
    @Query('status') status?: string,
    @Query('city') city?: string,
    @Query('intent') intent?: string,
  ) {
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (city) where.city = city;
    if (intent) where.intent = intent;
    const rows = await this.prisma.waitlist.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 5000,
    });
    const header =
      'email,intent,city,locale,status,utm_source,utm_campaign,created_at\n';
    const body = rows
      .map((r) =>
        [
          r.email,
          r.intent ?? '',
          r.city ?? '',
          r.locale ?? '',
          r.status,
          r.utmSource ?? '',
          r.utmCampaign ?? '',
          r.createdAt.toISOString(),
        ]
          .map((v) => String(v).replaceAll('"', '""'))
          .map((v) => (v.includes(',') || v.includes('"') ? `"${v}"` : v))
          .join(','),
      )
      .join('\n');
    return header + body + '\n';
  }
}
