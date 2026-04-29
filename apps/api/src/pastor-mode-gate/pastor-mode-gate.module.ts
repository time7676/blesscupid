import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../prisma/prisma.module.js';
import { RolesGuard } from '../common/roles.guard.js';
import {
  AdminPastorModeGateController,
  PastorModeGateController,
} from './pastor-mode-gate.controller.js';
import { PastorModeGateService } from './pastor-mode-gate.service.js';
import { PastorModeGateTelemetry } from './pastor-mode-gate.telemetry.js';

@Module({
  imports: [PrismaModule, JwtModule.register({})],
  controllers: [PastorModeGateController, AdminPastorModeGateController],
  providers: [PastorModeGateService, PastorModeGateTelemetry, RolesGuard],
  exports: [PastorModeGateService, PastorModeGateTelemetry],
})
export class PastorModeGateModule {}
