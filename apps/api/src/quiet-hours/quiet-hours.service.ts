import { Injectable, Logger } from '@nestjs/common';
import {
  HOLY_CODE_DEFAULT_WINDOW,
  QuietHoursConfigSchema,
  isQuietHours,
  type QuietHoursConfig,
  type QuietHoursPredicate,
  type QuietHoursWindow,
} from '@blesscupid/shared';
import { PrismaService } from '../prisma/prisma.service.js';

/**
 * BLE-129 — server-side QuietHoursPredicate.
 *
 * Reads the `timezone` + `quietHours` columns on `users` and decides whether
 * push notifications are currently suppressed for that user. Used by:
 *   - matching engine new-match push (BLE-8) → drops the push entirely.
 *   - realtime chat push (BLE-19, downstream)  → defers via {@link nextDeliveryAt}.
 */
@Injectable()
export class QuietHoursService {
  private readonly logger = new Logger(QuietHoursService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Bound predicate for use with `NotificationDispatcher.quietHours`.
   * Always returns false on missing config (legacy users). Logs and returns
   * false on read errors so a DB blip never silently drops every push.
   */
  predicate(now: () => Date = () => new Date()): QuietHoursPredicate {
    return async (userId: string) => {
      try {
        const config = await this.loadConfig(userId);
        return config ? isQuietHours(config, now()) : false;
      } catch (err) {
        this.logger.warn(`quiet-hours predicate failed for ${userId}: ${(err as Error).message}`);
        return false;
      }
    };
  }

  /** Load the user's stored config (or null if never set). */
  async loadConfig(userId: string): Promise<QuietHoursConfig | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { timezone: true, quietHours: true },
    });
    if (!user || !user.timezone) return null;
    const windows = parseWindows(user.quietHours);
    return { timezone: user.timezone, windows };
  }

  /**
   * Persist a new config. Validates IANA timezone + window shape via Zod.
   * Default window (Holy Code §7.4) is the canonical fallback for new users.
   */
  async setConfig(userId: string, config: QuietHoursConfig): Promise<QuietHoursConfig> {
    const parsed = QuietHoursConfigSchema.parse(config) as QuietHoursConfig;
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        timezone: parsed.timezone,
        quietHours: parsed.windows as unknown as object,
      },
    });
    return parsed;
  }

  /**
   * One-shot bootstrap: when a user first sets their timezone (e.g. during
   * onboarding `profile_basics`) we install the Holy Code default window.
   */
  async ensureDefaultForTimezone(userId: string, timezone: string): Promise<void> {
    QuietHoursConfigSchema.parse({ timezone, windows: [HOLY_CODE_DEFAULT_WINDOW] });
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        timezone,
        quietHours: [HOLY_CODE_DEFAULT_WINDOW] as unknown as object,
      },
    });
  }

  /**
   * Compute when the current quiet window ends, used by chat push (BLE-19) to
   * defer notifications. Returns null if not currently quiet.
   */
  nextDeliveryAt(config: QuietHoursConfig, now: Date): Date | null {
    if (!isQuietHours(config, now)) return null;
    // Window resolution: cheapest correct option is to step forward one minute
    // at a time. Maximum window length is 1440 min so this terminates fast.
    for (let step = 1; step <= 24 * 60; step++) {
      const candidate = new Date(now.getTime() + step * 60 * 1000);
      if (!isQuietHours(config, candidate)) return candidate;
    }
    return null;
  }
}

function parseWindows(raw: unknown): QuietHoursWindow[] {
  if (!Array.isArray(raw)) return [HOLY_CODE_DEFAULT_WINDOW];
  return raw as QuietHoursWindow[];
}
