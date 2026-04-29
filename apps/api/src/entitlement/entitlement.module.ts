import { Module } from '@nestjs/common';
import { EntitlementService } from './entitlement.service.js';
import { EntitlementController } from './entitlement.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { CoinModule } from '../coin/coin.module.js';

@Module({
  imports: [PrismaModule, CoinModule],
  providers: [EntitlementService],
  controllers: [EntitlementController],
  exports: [EntitlementService],
})
export class EntitlementModule {}
