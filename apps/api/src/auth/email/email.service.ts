/**
 * EmailService — thin SendGrid wrapper used by auth flows.
 *
 * Behavior per plan §"Defensive defaults for external services":
 *   - 3s timeout, 2 retries, surface explicit error on failure ("Email service
 *     temporarily unavailable, try again in a minute"). Never silent.
 *
 * Test-friendly: when `SENDGRID_API_KEY` is unset (local dev / vitest) the
 * service logs the OTP via `Logger` instead of dispatching, so backend lanes
 * can be exercised without a real SendGrid key.
 *
 * Templates referenced here are placeholder ids — Lane B copy task fills in
 * real SendGrid dynamic-template ids before launch.
 */

import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';

interface SendGridLikeClient {
  setApiKey(key: string): void;
  send(msg: unknown): Promise<unknown>;
}

const FROM_EMAIL = process.env['SENDGRID_FROM'] ?? 'noreply@blesscupid.com';
const FROM_NAME = process.env['SENDGRID_FROM_NAME'] ?? 'BlessCupid';
const TEMPLATE_PASSWORD_RESET =
  process.env['SENDGRID_TEMPLATE_PASSWORD_RESET'] ?? 'd-placeholder-password-reset';
const TEMPLATE_EMAIL_VERIFY =
  process.env['SENDGRID_TEMPLATE_EMAIL_VERIFY'] ?? 'd-placeholder-email-verify';

const TIMEOUT_MS = 3_000;
const MAX_RETRIES = 2;

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private client: SendGridLikeClient | null = null;

  constructor() {
    const key = process.env['SENDGRID_API_KEY'];
    if (!key) {
      this.logger.warn(
        'SENDGRID_API_KEY unset — emails will be logged instead of sent.',
      );
      return;
    }
    // Lazy require so tests / local dev without the dep installed still boot.
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const sg: SendGridLikeClient = require('@sendgrid/mail').default ??
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        require('@sendgrid/mail');
      sg.setApiKey(key);
      this.client = sg;
    } catch {
      this.logger.warn(
        '@sendgrid/mail not installed — falling back to log-only mode.',
      );
    }
  }

  async sendPasswordResetOtp(email: string, code: string): Promise<void> {
    await this.send({
      to: email,
      templateId: TEMPLATE_PASSWORD_RESET,
      dynamicTemplateData: { code, ttlMinutes: 15 },
      logTag: 'password-reset',
    });
  }

  async sendEmailVerifyOtp(email: string, code: string): Promise<void> {
    await this.send({
      to: email,
      templateId: TEMPLATE_EMAIL_VERIFY,
      dynamicTemplateData: { code, ttlMinutes: 15 },
      logTag: 'email-verify',
    });
  }

  private async send(args: {
    to: string;
    templateId: string;
    dynamicTemplateData: Record<string, unknown>;
    logTag: string;
  }): Promise<void> {
    if (!this.client) {
      // Dev / test fallback — log the OTP so the engineer can copy it.
      this.logger.log(
        `[email:${args.logTag}] to=${args.to} data=${JSON.stringify(args.dynamicTemplateData)}`,
      );
      return;
    }

    const msg = {
      to: args.to,
      from: { email: FROM_EMAIL, name: FROM_NAME },
      templateId: args.templateId,
      dynamicTemplateData: args.dynamicTemplateData,
    };

    let lastErr: unknown;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        await this.withTimeout(this.client.send(msg), TIMEOUT_MS);
        return;
      } catch (err) {
        lastErr = err;
        this.logger.warn(
          `[email:${args.logTag}] attempt ${attempt + 1} failed: ${(err as Error).message}`,
        );
      }
    }
    throw new ServiceUnavailableException({
      code: 'email_unavailable',
      message: 'Email service temporarily unavailable, try again in a minute.',
      cause: (lastErr as Error)?.message,
    });
  }

  private withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const t = setTimeout(() => reject(new Error(`timeout after ${ms}ms`)), ms);
      p.then(
        (v) => {
          clearTimeout(t);
          resolve(v);
        },
        (e) => {
          clearTimeout(t);
          reject(e);
        },
      );
    });
  }
}
