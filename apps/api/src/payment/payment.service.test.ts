import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { PaymentService } from './payment.service.js';

class FakePrisma {
  payments: any[] = [];
  userSubscription = {
    findFirst: vi.fn().mockResolvedValue(null),
    update: vi.fn().mockResolvedValue({}),
    create: vi.fn().mockResolvedValue({}),
  };
  payment = {
    findUnique: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue({}),
    update: vi.fn().mockResolvedValue({}),
  };
  user = { update: vi.fn().mockResolvedValue({}) };
}

describe('PaymentService.handleWebhook — security gate', () => {
  let originalToken: string | undefined;
  let svc: PaymentService;

  beforeEach(() => {
    originalToken = process.env['XENDIT_CALLBACK_TOKEN'];
    svc = new PaymentService(new FakePrisma() as never);
  });

  afterEach(() => {
    if (originalToken === undefined) delete process.env['XENDIT_CALLBACK_TOKEN'];
    else process.env['XENDIT_CALLBACK_TOKEN'] = originalToken;
  });

  it('throws InternalServerError when XENDIT_CALLBACK_TOKEN env is unset (fail-closed)', async () => {
    delete process.env['XENDIT_CALLBACK_TOKEN'];
    await expect(svc.handleWebhook({ event: 'invoice.paid' }, 'attacker-supplied'))
      .rejects.toThrow(InternalServerErrorException);
  });

  it('throws InternalServerError when env unset even with empty caller token', async () => {
    delete process.env['XENDIT_CALLBACK_TOKEN'];
    await expect(svc.handleWebhook({ event: 'invoice.paid' }, ''))
      .rejects.toThrow(InternalServerErrorException);
  });

  it('throws Unauthorized when caller token does not match env', async () => {
    process.env['XENDIT_CALLBACK_TOKEN'] = 'real-token';
    await expect(svc.handleWebhook({ event: 'invoice.paid' }, 'wrong-token'))
      .rejects.toThrow(UnauthorizedException);
  });

  it('throws Unauthorized when caller token is empty but env is set', async () => {
    process.env['XENDIT_CALLBACK_TOKEN'] = 'real-token';
    await expect(svc.handleWebhook({ event: 'invoice.paid' }, ''))
      .rejects.toThrow(UnauthorizedException);
  });

  it('returns received:true when token matches and event is unhandled', async () => {
    process.env['XENDIT_CALLBACK_TOKEN'] = 'real-token';
    const out = await svc.handleWebhook({ event: 'unknown.event' }, 'real-token');
    expect(out).toEqual({ received: true });
  });
});
