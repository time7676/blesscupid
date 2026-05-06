import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service.js';
import { PaymentController } from './payment.controller.js';
import { XenditService } from './xendit.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  providers: [PaymentService, XenditService],
  controllers: [PaymentController],
  exports: [PaymentService, XenditService],
})
export class PaymentModule {}
