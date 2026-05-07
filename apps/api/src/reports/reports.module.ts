import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AdminGuard } from '../verification/admin.guard.js';
import { ReportsController } from './reports.controller.js';
import { ReportsService } from './reports.service.js';

@Module({
  imports: [PrismaModule, JwtModule.register({})],
  controllers: [ReportsController],
  providers: [ReportsService, AdminGuard],
  exports: [ReportsService],
})
export class ReportsModule {}
