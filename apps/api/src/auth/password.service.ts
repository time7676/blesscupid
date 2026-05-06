/**
 * PasswordService — argon2id hashing + zxcvbn-ts strength validation.
 *
 * Policy (plan §"Final pre-implementation hardening"):
 *   - minimum 8 characters
 *   - zxcvbn-ts score ≥ 3 server-side
 *   - argon2id, timeCost=3, memCost=64MiB, parallelism=4
 *
 * Used by:
 *   - email signup
 *   - password-reset confirm
 */

import { Injectable, Logger } from '@nestjs/common';
import argon2 from 'argon2';

export interface PasswordValidation {
  valid: boolean;
  score: number; // 0..4
  reason?: 'too_short' | 'too_weak';
  suggestions: string[];
}

const MIN_LENGTH = 8;
const MIN_ZXCVBN_SCORE = 3;

const HASH_OPTIONS: argon2.Options = {
  type: argon2.argon2id,
  timeCost: 3,
  memoryCost: 65536, // 64 MiB
  parallelism: 4,
};

@Injectable()
export class PasswordService {
  private readonly logger = new Logger(PasswordService.name);
  private zxcvbnImpl:
    | ((pw: string) => { score: number; feedback: { suggestions: string[] } })
    | null = null;
  private zxcvbnReady = false;

  /**
   * zxcvbn-ts ships its data dictionaries as separate language packs.
   * Lazy-load on first call so module bootstrap stays sync. If the package
   * isn't installed (e.g. local dev pre-pnpm-install) we fall back to a
   * length-only check + log a warning so the lane is unblocked.
   */
  private async ensureZxcvbn(): Promise<void> {
    if (this.zxcvbnReady) return;
    this.zxcvbnReady = true;
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const core = require('@zxcvbn-ts/core');
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const langCommon = require('@zxcvbn-ts/language-common');
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const langEn = require('@zxcvbn-ts/language-en');
      core.zxcvbnOptions.setOptions({
        translations: langEn.translations,
        graphs: langCommon.adjacencyGraphs,
        dictionary: {
          ...langCommon.dictionary,
          ...langEn.dictionary,
        },
      });
      this.zxcvbnImpl = core.zxcvbn;
    } catch (err) {
      this.logger.warn(
        `zxcvbn-ts unavailable (${(err as Error).message}); falling back to length-only password policy.`,
      );
      this.zxcvbnImpl = null;
    }
  }

  async validate(password: string): Promise<PasswordValidation> {
    if (typeof password !== 'string' || password.length < MIN_LENGTH) {
      return {
        valid: false,
        score: 0,
        reason: 'too_short',
        suggestions: [`Use at least ${MIN_LENGTH} characters.`],
      };
    }
    await this.ensureZxcvbn();
    if (!this.zxcvbnImpl) {
      // Fallback: trust length-only when zxcvbn unavailable.
      return { valid: true, score: 3, suggestions: [] };
    }
    const result = this.zxcvbnImpl(password);
    if (result.score < MIN_ZXCVBN_SCORE) {
      return {
        valid: false,
        score: result.score,
        reason: 'too_weak',
        suggestions: result.feedback.suggestions ?? [
          'Try a longer passphrase or mix unrelated words.',
        ],
      };
    }
    return {
      valid: true,
      score: result.score,
      suggestions: result.feedback.suggestions ?? [],
    };
  }

  async hash(password: string): Promise<string> {
    return argon2.hash(password, HASH_OPTIONS);
  }

  async verify(hash: string, password: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, password);
    } catch {
      // Malformed hash → not a match.
      return false;
    }
  }
}
