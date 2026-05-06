import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../prisma/prisma.module.js';
import { WaitlistController } from './waitlist.controller.js';

/**
 * BLE 2026-05-06 — pre-launch waitlist module.
 *
 * Public POST /waitlist (rate-limited via @Throttle), admin
 * GET /waitlist/admin.csv (JWT + role-gated).
 */
@Module({
  imports: [PrismaModule, JwtModule.register({})],
  controllers: [WaitlistController],
})
export class WaitlistModule {}
