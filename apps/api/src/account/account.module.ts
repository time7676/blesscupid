import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { ModerationModule } from '../moderation/moderation.module.js';
import { MatchingModule } from '../matching/matching.module.js';
import { AccountController } from './account.controller.js';
import { AccountService } from './account.service.js';
import { AccountDeletionService } from './account-deletion.service.js';
import { BioController } from './bio.controller.js';
import { BioService } from './bio.service.js';
import { HardDeleteWorker } from './hard-delete.worker.js';

/**
 * AccountModule — `/v1/me/*` self-service surface + soft/hard-delete pipeline.
 *
 * TokenService (used by AccountDeletionService for session revoke) lives in
 * the @Global() AuthModule so we don't need to re-import it here.
 */
@Module({
  imports: [PrismaModule, ModerationModule, MatchingModule],
  controllers: [AccountController, BioController],
  providers: [AccountService, AccountDeletionService, BioService, HardDeleteWorker],
  exports: [AccountService, AccountDeletionService, HardDeleteWorker],
})
export class AccountModule {}
