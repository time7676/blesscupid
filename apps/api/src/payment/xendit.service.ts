import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';

/**
 * XenditService — thin REST wrapper over the Xendit API.
 *
 * Auth: Basic with secret API key. The Xendit "username" is the secret key,
 * password empty. (Per Xendit docs.)
 *
 * Endpoints used:
 *   POST /v2/invoices                              — one-shot checkout
 *   POST /recurring/plans                          — recurring subscription plan
 *   POST /recurring/plans/:id/actions/cancel       — cancel a recurring plan
 *
 * No external SDK — Xendit ships no official Node SDK. fetch() with a small
 * retry loop on transient 5xx is enough.
 */

export type SubscriptionCycle = 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export interface CreateInvoiceInput {
  externalId: string;
  amountIdr: number;
  payerEmail?: string;
  description: string;
  successRedirectUrl?: string;
  failureRedirectUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface CreateInvoiceResult {
  id: string;
  externalId: string;
  invoiceUrl: string;
  status: string;
  amount: number;
  expiryDate: string;
  raw: unknown;
}

export interface CreateRecurringInput {
  externalId: string;
  amountIdr: number;
  cycle: SubscriptionCycle;
  customerId?: string;
  payerEmail?: string;
  description: string;
  /**
   * If set, Xendit defers the first charge by this many days (used for the
   * 7-day Bless+ trial → firstChargeAfterDays = 7).
   */
  firstChargeAfterDays?: number;
  metadata?: Record<string, unknown>;
}

export interface CreateRecurringResult {
  id: string;
  externalId: string;
  status: string;
  scheduleId?: string;
  raw: unknown;
}

const XENDIT_BASE_URL = 'https://api.xendit.co';

@Injectable()
export class XenditService {
  private readonly logger = new Logger(XenditService.name);

  private get secretKey(): string {
    const key = process.env['XENDIT_SECRET_KEY'];
    if (!key) {
      throw new InternalServerErrorException({ code: 'xendit_misconfigured' });
    }
    return key;
  }

  private authHeader(): string {
    // Basic auth: base64("<secret>:") — note trailing colon, password empty.
    const token = Buffer.from(`${this.secretKey}:`).toString('base64');
    return `Basic ${token}`;
  }

  private async request<T>(
    method: 'GET' | 'POST',
    path: string,
    body?: unknown,
    extraHeaders: Record<string, string> = {},
  ): Promise<T> {
    const url = `${XENDIT_BASE_URL}${path}`;
    const init: RequestInit = {
      method,
      headers: {
        Authorization: this.authHeader(),
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...extraHeaders,
      },
      body: body ? JSON.stringify(body) : undefined,
    };

    let lastErr: unknown = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await fetch(url, init);
        if (res.status >= 500) {
          // transient — retry with light backoff
          lastErr = new Error(`xendit ${res.status}`);
          await sleep(150 * (attempt + 1));
          continue;
        }
        const text = await res.text();
        const json = text ? safeJson(text) : null;
        if (!res.ok) {
          this.logger.error(
            `Xendit ${method} ${path} failed: ${res.status} ${text.slice(0, 500)}`,
          );
          throw new InternalServerErrorException({
            code: 'xendit_error',
            status: res.status,
            body: json ?? text,
          });
        }
        return json as T;
      } catch (err) {
        lastErr = err;
        if (attempt === 2) break;
        await sleep(150 * (attempt + 1));
      }
    }
    this.logger.error(`Xendit ${method} ${path} exhausted retries: ${String(lastErr)}`);
    throw new InternalServerErrorException({ code: 'xendit_unreachable' });
  }

  /**
   * One-shot Xendit invoice — returns hosted checkout URL.
   * Used for non-recurring purchases (legacy path; subscriptions prefer recurring).
   */
  async createInvoice(input: CreateInvoiceInput): Promise<CreateInvoiceResult> {
    const payload: Record<string, unknown> = {
      external_id: input.externalId,
      amount: input.amountIdr,
      currency: 'IDR',
      description: input.description,
    };
    if (input.payerEmail) payload['payer_email'] = input.payerEmail;
    if (input.successRedirectUrl) payload['success_redirect_url'] = input.successRedirectUrl;
    if (input.failureRedirectUrl) payload['failure_redirect_url'] = input.failureRedirectUrl;
    if (input.metadata) payload['metadata'] = input.metadata;

    const raw = await this.request<Record<string, unknown>>('POST', '/v2/invoices', payload);
    return {
      id: String(raw['id']),
      externalId: String(raw['external_id']),
      invoiceUrl: String(raw['invoice_url']),
      status: String(raw['status']),
      amount: Number(raw['amount']),
      expiryDate: String(raw['expiry_date']),
      raw,
    };
  }

  /**
   * Create a Xendit recurring plan. Used for Bless+ subscriptions and for the
   * 7-day trial via firstChargeAfterDays=7.
   */
  async createRecurring(input: CreateRecurringInput): Promise<CreateRecurringResult> {
    const interval = cycleToInterval(input.cycle);
    const payload: Record<string, unknown> = {
      reference_id: input.externalId,
      currency: 'IDR',
      amount: input.amountIdr,
      schedule: {
        reference_id: `${input.externalId}-schedule`,
        interval: interval.unit,
        interval_count: interval.count,
        anchor_date:
          input.firstChargeAfterDays && input.firstChargeAfterDays > 0
            ? new Date(Date.now() + input.firstChargeAfterDays * 86_400_000).toISOString()
            : new Date().toISOString(),
      },
      description: input.description,
      metadata: input.metadata ?? {},
    };
    if (input.customerId) payload['customer_id'] = input.customerId;
    if (input.payerEmail) payload['payer_email'] = input.payerEmail;

    const raw = await this.request<Record<string, unknown>>('POST', '/recurring/plans', payload);
    return {
      id: String(raw['id']),
      externalId: String(raw['reference_id'] ?? input.externalId),
      status: String(raw['status']),
      scheduleId:
        raw['schedule'] && typeof raw['schedule'] === 'object'
          ? String((raw['schedule'] as Record<string, unknown>)['id'])
          : undefined,
      raw,
    };
  }

  /** Cancel a recurring plan. No-op-safe: returns null on 404. */
  async cancelRecurring(xenditRecurringId: string): Promise<unknown | null> {
    try {
      return await this.request<unknown>(
        'POST',
        `/recurring/plans/${xenditRecurringId}/actions/cancel`,
      );
    } catch (err) {
      this.logger.warn(`cancelRecurring(${xenditRecurringId}) failed: ${String(err)}`);
      // Don't break user-visible cancel flow on Xendit hiccups — we still flip
      // status locally; webhooks will reconcile.
      return null;
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function cycleToInterval(cycle: SubscriptionCycle): { unit: 'DAY' | 'WEEK' | 'MONTH'; count: number } {
  switch (cycle) {
    case 'weekly':
      return { unit: 'WEEK', count: 1 };
    case 'monthly':
      return { unit: 'MONTH', count: 1 };
    case 'quarterly':
      return { unit: 'MONTH', count: 3 };
    case 'yearly':
      return { unit: 'MONTH', count: 12 };
  }
}
