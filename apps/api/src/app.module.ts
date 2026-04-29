import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ObservabilityModule } from './observability/observability.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './auth/auth.module.js';
import { OnboardingModule } from './onboarding/onboarding.module.js';
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

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ObservabilityModule,
    HealthModule,
    PrismaModule,
    AuthModule,
    PhoneAuthModule,
    KycModule,
    OnboardingModule,
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
  ],
})
export class AppModule {}
