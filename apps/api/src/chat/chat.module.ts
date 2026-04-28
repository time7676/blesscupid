import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../prisma/prisma.module.js';
import { ModerationModule } from '../moderation/moderation.module.js';
import { ChatController } from './chat.controller.js';
import { ChatService } from './chat.service.js';
import { ChatModerationPipeline } from './moderation-pipeline.provider.js';
import { PrismaModerationStore } from './prisma-moderation-store.js';
import { EvidenceFreezeGuard } from './evidence-freeze.guard.js';

@Module({
  imports: [PrismaModule, ModerationModule, JwtModule.register({})],
  controllers: [ChatController],
  providers: [
    ChatService,
    ChatModerationPipeline,
    PrismaModerationStore,
    EvidenceFreezeGuard,
  ],
  exports: [
    ChatService,
    ChatModerationPipeline,
    PrismaModerationStore,
    EvidenceFreezeGuard,
  ],
})
export class ChatModule {}
