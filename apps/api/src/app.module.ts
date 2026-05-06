import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ObservabilityModule } from './observability/observability.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
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
import { QuietHoursModule } from './quiet-hours/quiet-hours.module.js';
import { PastorModeGateModule } from './pastor-mode-gate/pastor-mode-gate.module.js';
import { PastorModeRelationshipModule } from './pastor-mode-relationship/pastor-mode-relationship.module.js';
import { ModerationActionsModule } from './moderation-actions/moderation-actions.module.js';
import { WalkingWithModule } from './walking-with/walking-with.module.js';
import { PhoneAuthModule } from './phone-auth/phone-auth.module.js';
import { KycModule } from './kyc/kyc.module.js';
import { SubscriptionModule } from './subscription/subscription.module.js';
import { PaymentModule } from './payment/payment.module.js';
import { CoinModule } from './coin/coin.module.js';
import { EntitlementModule } from './entitlement/entitlement.module.js';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      { name: 'default', ttl: 60_000, limit: 60 },
    ]),
    ObservabilityModule,
    HealthModule,
    PrismaModule,
    AuthModule,
    PhoneAuthModule,
    KycModule,
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
    QuietHoursModule,
    PastorModeGateModule,
    PastorModeRelationshipModule,
    ModerationActionsModule,
    WalkingWithModule,
    SubscriptionModule,
    PaymentModule,
    CoinModule,
    EntitlementModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
