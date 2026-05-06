import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../prisma/prisma.module.js';
import { ModerationModule } from '../moderation/moderation.module.js';
import { AccountController } from './account.controller.js';
import { AccountExtensionController } from './account-extension.controller.js';
import { AccountDeletionService } from './account-deletion.service.js';
import { BioController } from './bio.controller.js';
import { BioService } from './bio.service.js';
import { HardDeleteWorker } from './hard-delete.worker.js';

@Module({
  imports: [PrismaModule, ModerationModule, JwtModule.register({})],
  controllers: [AccountController, BioController, AccountExtensionController],
  providers: [AccountDeletionService, BioService, HardDeleteWorker],
  exports: [AccountDeletionService, HardDeleteWorker],
})
export class AccountModule {}
