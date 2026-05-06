import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { Prisma, SubscriptionCycle, SubscriptionStatus } from '@prisma/client';
import { randomUUID } from 'node:crypto';

const GRACE_PERIOD_DAYS = 3;

type WebhookResult = { received: true; idempotent?: boolean; eventType: string };

/**
 * PaymentService — Xendit webhook receiver + idempotency.
 *
 * Fail-closed contract:
 *   • XENDIT_CALLBACK_TOKEN unset → 500 (never silently accept).
 *   • token mismatch              → 401.
 *
 * Idempotency:
 *   • PaymentTransaction.metadata.processedEvents[] = list of `${eventType}:${eventId}`.
 *   • Duplicate `(eventType, eventId)` → no-op, returns idempotent:true.
 */
@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(private readonly prisma: PrismaService) {}

  async handleWebhook(body: unknown, callbackToken: string): Promise<WebhookResult> {
    const expected = process.env['XENDIT_CALLBACK_TOKEN'];
    if (!expected) {
      this.logger.error('XENDIT_CALLBACK_TOKEN env unset — fail-closed');
      throw new InternalServerErrorException({ code: 'webhook_misconfigured' });
    }
    if (!callbackToken || callbackToken !== expected) {
      throw new UnauthorizedException({ code: 'invalid_callback_token' });
    }

    const event = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;
    const eventType = normalizeEventType(event);
    const eventId = String(event['id'] ?? event['event_id'] ?? '');

    this.logger.log(`xendit-webhook recv eventType=${eventType} id=${eventId}`);

    try {
      switch (eventType) {
        case 'invoice.paid':
          return await this.handleInvoicePaid(event, eventType, eventId);
        case 'invoice.expired':
          return await this.handleInvoiceExpired(event, eventType, eventId);
        case 'recurring.payment.succeeded':
          return await this.handleRecurringSuccess(event, eventType, eventId);
        case 'recurring.payment.failed':
          return await this.handleRecurringFailed(event, eventType, eventId);
        case 'recurring.cancelled':
          return await this.handleRecurringCancelled(event, eventType, eventId);
        default:
          // Unknown event type — log + 200 so Xendit doesn't retry forever.
          this.logger.warn(`xendit-webhook unhandled eventType=${eventType}`);
          return { received: true, eventType };
      }
    } catch (err) {
      // Anything thrown here would 5xx → Xendit retries. That's fine: the
      // webhook handlers are idempotent. Just log loudly.
      this.logger.error(`xendit-webhook handler crash: ${String(err)}`);
      throw err;
    }
  }

  // ─── Event handlers ─────────────────────────────────────────────

  private async handleInvoicePaid(
    event: Record<string, unknown>,
    eventType: string,
    eventId: string,
  ): Promise<WebhookResult> {
    const invoiceId = String(event['id'] ?? '');
    const externalId = (event['external_id'] as string | undefined) ?? null;
    if (!invoiceId) return { received: true, eventType };

    const tx = await this.prisma.paymentTransaction.findUnique({
      where: { xenditInvoiceId: invoiceId },
    });
    if (!tx) {
      this.logger.warn(`invoice.paid: no PaymentTransaction for invoice=${invoiceId}`);
      return { received: true, eventType };
    }

    if (alreadyProcessed(tx.metadata, eventType, eventId)) {
      return { received: true, idempotent: true, eventType };
    }

    const paidAt = parseDate(event['paid_at']) ?? new Date();
    const userId = tx.userId;

    await this.prisma.$transaction(async (txp) => {
      await txp.paymentTransaction.update({
        where: { id: tx.id },
        data: {
          status: 'paid',
          paidAt,
          metadata: appendProcessedEvent(tx.metadata, eventType, eventId, {
            xenditEvent: event,
          }),
        },
      });

      const cycle = readCycle(tx.metadata);
      const expiresAt = cycle ? cycleEnd(paidAt, cycle) : null;

      // Activate the subscription.
      const existing = await txp.userSubscription.findUnique({ where: { userId } });
      if (existing) {
        await txp.userSubscription.update({
          where: { userId },
          data: {
            tier: 'blessplus',
            status: 'active',
            cycle: cycle ?? existing.cycle,
            startedAt: existing.startedAt ?? paidAt,
            expiresAt,
            trialEndsAt: null,
            cancelledAt: null,
          },
        });
      } else {
        await txp.userSubscription.create({
          data: {
            userId,
            tier: 'blessplus',
            status: 'active',
            cycle: cycle ?? 'monthly',
            startedAt: paidAt,
            expiresAt,
          },
        });
      }
    });

    this.logger.log(`invoice.paid processed user=${userId} invoice=${invoiceId} ext=${externalId}`);
    return { received: true, eventType };
  }

  private async handleInvoiceExpired(
    event: Record<string, unknown>,
    eventType: string,
    eventId: string,
  ): Promise<WebhookResult> {
    const invoiceId = String(event['id'] ?? '');
    if (!invoiceId) return { received: true, eventType };

    const tx = await this.prisma.paymentTransaction.findUnique({
      where: { xenditInvoiceId: invoiceId },
    });
    if (!tx) return { received: true, eventType };
    if (alreadyProcessed(tx.metadata, eventType, eventId)) {
      return { received: true, idempotent: true, eventType };
    }

    await this.prisma.paymentTransaction.update({
      where: { id: tx.id },
      data: {
        status: tx.status === 'paid' ? tx.status : 'cancelled',
        metadata: appendProcessedEvent(tx.metadata, eventType, eventId, { xenditEvent: event }),
      },
    });
    return { received: true, eventType };
  }

  private async handleRecurringSuccess(
    event: Record<string, unknown>,
    eventType: string,
    eventId: string,
  ): Promise<WebhookResult> {
    const recurringId = recurringIdOf(event);
    const chargeId = String(event['charge_id'] ?? event['payment_id'] ?? '');
    if (!recurringId) return { received: true, eventType };

    const sub = await this.prisma.userSubscription.findFirst({
      where: { xenditRecurringId: recurringId },
    });
    if (!sub) {
      this.logger.warn(`recurring.success: no UserSubscription for ${recurringId}`);
      return { received: true, eventType };
    }

    // Idempotency at PaymentTransaction layer — find or create a row for this charge.
    if (chargeId) {
      const existing = await this.prisma.paymentTransaction.findUnique({
        where: { xenditChargeId: chargeId },
      });
      if (existing && alreadyProcessed(existing.metadata, eventType, eventId)) {
        return { received: true, idempotent: true, eventType };
      }
      const amount = Number(event['amount'] ?? 0);
      if (existing) {
        await this.prisma.paymentTransaction.update({
          where: { id: existing.id },
          data: {
            status: 'paid',
            paidAt: parseDate(event['paid_at']) ?? new Date(),
            metadata: appendProcessedEvent(existing.metadata, eventType, eventId, {
              xenditEvent: event,
            }),
          },
        });
      } else {
        await this.prisma.paymentTransaction.create({
          data: {
            id: randomUUID(),
            userId: sub.userId,
            type: 'subscription',
            amountIdr: amount,
            status: 'paid',
            method: 'xendit_recurring',
            xenditChargeId: chargeId,
            xenditRecurringId: recurringId,
            paidAt: parseDate(event['paid_at']) ?? new Date(),
            metadata: {
              kind: 'subscription_renewal',
              processedEvents: [`${eventType}:${eventId}`],
              xenditEvent: event,
            } as Prisma.JsonObject,
          },
        });
      }
    }

    const now = new Date();
    const newExpiry = sub.cycle ? cycleEnd(now, sub.cycle) : sub.expiresAt;
    await this.prisma.userSubscription.update({
      where: { userId: sub.userId },
      data: {
        tier: 'blessplus',
        status: 'active' as SubscriptionStatus,
        startedAt: sub.startedAt ?? now,
        expiresAt: newExpiry,
        trialEndsAt: null,
      },
    });

    return { received: true, eventType };
  }

  private async handleRecurringFailed(
    event: Record<string, unknown>,
    eventType: string,
    eventId: string,
  ): Promise<WebhookResult> {
    const recurringId = recurringIdOf(event);
    if (!recurringId) return { received: true, eventType };

    const sub = await this.prisma.userSubscription.findFirst({
      where: { xenditRecurringId: recurringId },
    });
    if (!sub) return { received: true, eventType };

    const graceUntil = new Date(Date.now() + GRACE_PERIOD_DAYS * 86_400_000);

    await this.prisma.userSubscription.update({
      where: { userId: sub.userId },
      data: {
        status: 'grace_period',
        expiresAt: graceUntil,
      },
    });

    // Audit row.
    await this.prisma.paymentTransaction.create({
      data: {
        id: randomUUID(),
        userId: sub.userId,
        type: 'subscription',
        amountIdr: Number(event['amount'] ?? 0),
        status: 'failed',
        method: 'xendit_recurring',
        xenditRecurringId: recurringId,
        failedAt: new Date(),
        metadata: {
          kind: 'recurring_failed',
          graceUntil: graceUntil.toISOString(),
          processedEvents: [`${eventType}:${eventId}`],
          xenditEvent: event,
        } as Prisma.JsonObject,
      },
    });

    this.logger.warn(
      `recurring.failed user=${sub.userId} → grace_period until ${graceUntil.toISOString()}`,
    );
    return { received: true, eventType };
  }

  private async handleRecurringCancelled(
    event: Record<string, unknown>,
    eventType: string,
    eventId: string,
  ): Promise<WebhookResult> {
    const recurringId = recurringIdOf(event);
    if (!recurringId) return { received: true, eventType };

    const sub = await this.prisma.userSubscription.findFirst({
      where: { xenditRecurringId: recurringId },
    });
    if (!sub) return { received: true, eventType };

    // Don't downgrade tier here — keep in step with /subscription/cancel
    // semantics: paid period honored. Just mark cancelled if not already.
    if (sub.status !== 'cancelled' && sub.status !== 'expired') {
      await this.prisma.userSubscription.update({
        where: { userId: sub.userId },
        data: {
          status: 'cancelled',
          cancelledAt: sub.cancelledAt ?? new Date(),
        },
      });
    }
    this.logger.log(`recurring.cancelled user=${sub.userId} eventId=${eventId}`);
    return { received: true, eventType };
  }
}

// ─── Helpers ───────────────────────────────────────────────────────

function normalizeEventType(event: Record<string, unknown>): string {
  const raw = (event['event'] ?? event['status'] ?? '') as string;
  const lc = String(raw).toLowerCase();
  // Xendit ships v1 status strings (PAID, EXPIRED) AND v2 dotted events.
  if (lc === 'paid') return 'invoice.paid';
  if (lc === 'expired') return 'invoice.expired';
  if (lc === 'active' || lc === 'recurring.activated') return 'recurring.activated';
  if (lc === 'recurring.payment.succeeded' || lc === 'recurring_charge.succeeded') {
    return 'recurring.payment.succeeded';
  }
  if (lc === 'recurring.payment.failed' || lc === 'recurring_charge.failed') {
    return 'recurring.payment.failed';
  }
  if (lc === 'recurring.cancelled' || lc === 'recurring_plan.cancelled') {
    return 'recurring.cancelled';
  }
  return lc;
}

function recurringIdOf(event: Record<string, unknown>): string {
  return String(
    event['recurring_payment_id'] ??
      event['recurring_plan_id'] ??
      event['plan_id'] ??
      event['id'] ??
      '',
  );
}

function alreadyProcessed(metadata: unknown, eventType: string, eventId: string): boolean {
  if (!eventId) return false;
  const m = (metadata && typeof metadata === 'object' ? metadata : {}) as Record<string, unknown>;
  const list = m['processedEvents'];
  if (!Array.isArray(list)) return false;
  return list.includes(`${eventType}:${eventId}`);
}

function appendProcessedEvent(
  metadata: unknown,
  eventType: string,
  eventId: string,
  extras: Record<string, unknown>,
): Prisma.JsonObject {
  const m = (metadata && typeof metadata === 'object' ? metadata : {}) as Record<string, unknown>;
  const prior = Array.isArray(m['processedEvents']) ? (m['processedEvents'] as unknown[]) : [];
  const tag = `${eventType}:${eventId}`;
  const next = prior.includes(tag) ? prior : [...prior, tag];
  return { ...m, ...extras, processedEvents: next } as Prisma.JsonObject;
}

function readCycle(metadata: unknown): SubscriptionCycle | null {
  const m = (metadata && typeof metadata === 'object' ? metadata : {}) as Record<string, unknown>;
  const c = m['cycle'];
  if (c === 'weekly' || c === 'monthly' || c === 'quarterly' || c === 'yearly') {
    return c;
  }
  return null;
}

function cycleEnd(from: Date, cycle: SubscriptionCycle): Date {
  const d = new Date(from);
  switch (cycle) {
    case 'weekly':
      d.setDate(d.getDate() + 7);
      break;
    case 'monthly':
      d.setMonth(d.getMonth() + 1);
      break;
    case 'quarterly':
      d.setMonth(d.getMonth() + 3);
      break;
    case 'yearly':
      d.setFullYear(d.getFullYear() + 1);
      break;
  }
  return d;
}

function parseDate(v: unknown): Date | null {
  if (!v) return null;
  if (v instanceof Date) return v;
  const d = new Date(String(v));
  return isNaN(d.getTime()) ? null : d;
}
