/**
 * MatchingModule — v1-restart wiring.
 *
 *   - MatchingController : /v1/matches/*
 *   - MatchingService    : pure-engine glue + Prisma + Redis
 *   - DailyStackProcessor: BullMQ cron + per-user worker
 *
 * The legacy MatchingPriorityService / MatchingExtensionController /
 * QuotaService / DailyStackCronService have been folded into MatchingService
 * + DailyStackProcessor.
 */

import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from '../prisma/prisma.module.js';
import { RedisModule } from '../redis/redis.module.js';
import { DailyStackProcessor, DAILY_STACK_QUEUE } from './daily-stack.processor.js';
import { MatchingController } from './matching.controller.js';
import { MatchingService } from './matching.service.js';

@Module({
  imports: [
    PrismaModule,
    RedisModule,
    BullModule.registerQueue({ name: DAILY_STACK_QUEUE }),
  ],
  controllers: [MatchingController],
  providers: [MatchingService, DailyStackProcessor],
  exports: [MatchingService],
})
export class MatchingModule {}
