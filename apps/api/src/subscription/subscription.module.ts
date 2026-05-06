import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { SubscriptionService } from './subscription.service.js';
import { SubscriptionController } from './subscription.controller.js';
import { BillingAliasController } from './billing-alias.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { XenditService } from '../payment/xendit.service.js';

@Module({
  imports: [PrismaModule, JwtModule.register({})],
  providers: [SubscriptionService, XenditService],
  controllers: [SubscriptionController, BillingAliasController],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}
