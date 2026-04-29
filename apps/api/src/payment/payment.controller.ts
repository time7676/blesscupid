import { Controller, Post, Body, Headers } from '@nestjs/common';
import { PaymentService } from './payment.service.js';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('webhooks/xendit')
  async handleXenditWebhook(
    @Body() body: unknown,
    @Headers('x-callback-token') callbackToken: string,
  ) {
    return this.paymentService.handleWebhook(body, callbackToken);
  }
}
