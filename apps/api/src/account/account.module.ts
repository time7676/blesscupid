import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../prisma/prisma.module.js';
import { ModerationModule } from '../moderation/moderation.module.js';
import { AccountController } from './account.controller.js';
import { AccountDeletionService } from './account-deletion.service.js';
import { BioController } from './bio.controller.js';
import { BioService } from './bio.service.js';

@Module({
  imports: [PrismaModule, ModerationModule, JwtModule.register({})],
  controllers: [AccountController, BioController],
  providers: [AccountDeletionService, BioService],
  exports: [AccountDeletionService],
})
export class AccountModule {}
