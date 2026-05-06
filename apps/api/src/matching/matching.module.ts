import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { DailyStackCronService } from './daily-stack-cron.service.js';
import { MatchingController } from './matching.controller.js';
import { MatchingExtensionController } from './matching-extension.controller.js';
import { MatchingPriorityService } from './matching-priority.service.js';
import { MatchingService } from './matching.service.js';
import { QuotaService } from './quota.service.js';

/**
 * BLE eng-review 2026-05-06 — Lane B.
 *
 * Wires the pure-function matching engine in `services/matching` to:
 *   - GET /matches/today + POST /matches/decision (controller)
 *   - DailyStack + MatchDecision Prisma persistence (service)
 *   - Nightly @Cron('0 4 * * *') job (DailyStackCronService)
 *
 * MatchingPriorityService stays exported for the existing Bless+ tier
 * boost wiring elsewhere (subscription module).
 */
@Module({
  imports: [PrismaModule],
  controllers: [MatchingController, MatchingExtensionController],
  providers: [MatchingService, MatchingPriorityService, DailyStackCronService, QuotaService],
  exports: [MatchingService, MatchingPriorityService, QuotaService],
})
export class MatchingModule {}
