import { Controller, Post, Body, Headers, HttpCode, HttpStatus } from '@nestjs/common';
import { PaymentService } from './payment.service.js';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  /**
   * Xendit webhook receiver.
   *
   * Auth: header `x-callback-token` must equal env `XENDIT_CALLBACK_TOKEN`
   * (fail-closed; missing env → 500, mismatch → 401).
   *
   * Idempotent on `(eventType, eventId)` — duplicate deliveries no-op.
   * Returns 200 quickly to keep Xendit's retry queue clean.
   */
  @Post('webhooks/xendit')
  @HttpCode(HttpStatus.OK)
  async handleXenditWebhook(
    @Body() body: unknown,
    @Headers('x-callback-token') callbackToken: string,
  ) {
    return this.paymentService.handleWebhook(body, callbackToken ?? '');
  }
}
