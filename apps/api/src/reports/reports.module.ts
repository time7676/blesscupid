import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../prisma/prisma.module.js';
import { ChatModule } from '../chat/chat.module.js';
import { RolesGuard } from '../common/roles.guard.js';
import { ReportsController } from './reports.controller.js';
import { ReportsService } from './reports.service.js';

@Module({
  imports: [PrismaModule, ChatModule, JwtModule.register({})],
  controllers: [ReportsController],
  providers: [ReportsService, RolesGuard],
  exports: [ReportsService],
})
export class ReportsModule {}
