import { Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class PaymentService {
  constructor(private readonly prisma: PrismaService) {}

  async handleWebhook(body: unknown, callbackToken: string): Promise<{ received: boolean }> {
    const token = process.env['XENDIT_CALLBACK_TOKEN'];
    if (!token) {
      throw new InternalServerErrorException({ code: 'webhook_misconfigured' });
    }
    if (callbackToken !== token) {
      throw new UnauthorizedException({ code: 'invalid_callback_token' });
    }

    const event = body as Record<string, unknown>;
    const eventType = event['event'] || event['status'];

    if (eventType === 'invoice.paid' || eventType === 'PAID') {
      await this.handleInvoicePaid(event);
    } else if (eventType === 'invoice.expired' || eventType === 'EXPIRED') {
      await this.handleInvoiceExpired(event);
    } else if (eventType === 'recurring.payment.succeeded') {
      await this.handleRecurringSuccess(event);
    } else if (eventType === 'recurring.payment.failed') {
      await this.handleRecurringFailed(event);
    }

    return { received: true };
  }

  private async handleInvoicePaid(event: Record<string, unknown>) {
    const invoiceId = event['id'] as string;
    const externalId = event['external_id'] as string;
    if (!invoiceId || !externalId) return;

    await this.prisma.paymentTransaction.updateMany({
      where: { xenditInvoiceId: invoiceId },
      data: {
        status: 'paid',
        paidAt: new Date(),
      },
    });
  }

  private async handleInvoiceExpired(event: Record<string, unknown>) {
    const invoiceId = event['id'] as string;
    if (!invoiceId) return;

    await this.prisma.paymentTransaction.updateMany({
      where: { xenditInvoiceId: invoiceId, status: 'pending' },
      data: { status: 'cancelled' },
    });
  }

  private async handleRecurringSuccess(event: Record<string, unknown>) {
    const recurringId = event['recurring_payment_id'] as string;
    if (!recurringId) return;

    await this.prisma.userSubscription.updateMany({
      where: { xenditRecurringId: recurringId },
      data: { status: 'active' },
    });
  }

  private async handleRecurringFailed(event: Record<string, unknown>) {
    const recurringId = event['recurring_payment_id'] as string;
    if (!recurringId) return;

    await this.prisma.userSubscription.updateMany({
      where: { xenditRecurringId: recurringId },
      data: { status: 'payment_failed' },
    });
  }
}
