import { Module } from '@nestjs/common';
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
import { QuietHoursModule } from './quiet-hours/quiet-hours.module.js';

@Module({
  imports: [
    ObservabilityModule,
    HealthModule,
    PrismaModule,
    AuthModule,
    OnboardingModule,
    ModerationModule,
    PhotosModule,
    ChatModule,
    ReportsModule,
    BlocksModule,
    AdminModule,
    AccountModule,
    QuietHoursModule,
  ],
})
export class AppModule {}
