import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ObservabilityModule } from './observability/observability.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { RedisModule } from './redis/redis.module.js';
import { AuthModule } from './auth/auth.module.js';
import { OnboardingModule } from './onboarding/onboarding.module.js';
import { MatchingModule } from './matching/matching.module.js';
import { NotificationsModule } from './notifications/notifications.module.js';
import { WaitlistModule } from './waitlist/waitlist.module.js';
import { ModerationModule } from './moderation/moderation.module.js';
import { PhotosModule } from './photos/photos.module.js';
import { HealthModule } from './health/health.module.js';
import { ChatModule } from './chat/chat.module.js';
import { ReportsModule } from './reports/reports.module.js';
import { BlocksModule } from './blocks/blocks.module.js';
import { AdminModule } from './admin/admin.module.js';
import { AccountModule } from './account/account.module.js';
import { VerseModule } from './verse/verse.module.js';
import { SubscriptionModule } from './subscription/subscription.module.js';
import { PaymentModule } from './payment/payment.module.js';
import { StatusModule } from './status/status.module.js';
import { VerificationModule } from './verification/verification.module.js';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      { name: 'default', ttl: 60_000, limit: 60 },
      { name: 'auth', ttl: 60_000, limit: 5 },
      { name: 'message', ttl: 60_000, limit: 30 },
      { name: 'decision', ttl: 60_000, limit: 60 },
    ]),
    ObservabilityModule,
    HealthModule,
    PrismaModule,
    RedisModule,
    AuthModule,
    OnboardingModule,
    MatchingModule,
    NotificationsModule,
    WaitlistModule,
    ModerationModule,
    PhotosModule,
    ChatModule,
    ReportsModule,
    BlocksModule,
    AdminModule,
    AccountModule,
    VerseModule,
    SubscriptionModule,
    PaymentModule,
    StatusModule,
    VerificationModule,
    // v1-restart pending:
    // - I18nModule extension (keys for new screens)
    // - DailyQuota helpers folded into MatchingService (DONE per matching agent)
    // - BullMQ root config (BullModule.forRoot connection) — TODO
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
