import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../prisma/prisma.module.js';
import { RolesGuard } from '../common/roles.guard.js';
import { ModerationActionLogService } from './moderation-action-log.service.js';
import { ModerationActionLogController } from './moderation-action-log.controller.js';

@Module({
  imports: [PrismaModule, JwtModule.register({})],
  controllers: [ModerationActionLogController],
  providers: [ModerationActionLogService, RolesGuard],
  exports: [ModerationActionLogService],
})
export class ModerationActionsModule {}
