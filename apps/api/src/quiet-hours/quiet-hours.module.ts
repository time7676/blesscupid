import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../prisma/prisma.module.js';
import { QuietHoursController } from './quiet-hours.controller.js';
import { QuietHoursService } from './quiet-hours.service.js';

@Module({
  imports: [PrismaModule, JwtModule.register({})],
  controllers: [QuietHoursController],
  providers: [QuietHoursService],
  exports: [QuietHoursService],
})
export class QuietHoursModule {}
