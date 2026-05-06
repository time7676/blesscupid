import { BadRequestException } from '@nestjs/common';
import { WhimsicalAnswersSchema, type WhimsicalAnswers } from '@blesscupid/shared';
import type { Prisma } from '@prisma/client';

/**
 * Strict validator for `Profile.whimsicalAnswers` JSON.
 *
 * Used by services/matching for cosine vector mapping (see plan
 * `~/.claude/plans/i-think-we-need-misty-eclipse.md` §"Whimsical-affinity
 * scoring note") — every read assumes q1/q3/q5/q7 are present and shaped.
 *
 * Reject:
 *   - missing keys (q1, q3, q5, q7 all required at completion)
 *   - extra/unknown keys
 *   - values outside the per-question enums
 *
 * Throws `BadRequestException` with `{ code: 'whimsical_invalid', issues }`
 * to keep the failure shape consistent with `ZodValidationPipe`.
 */
export function assertWhimsicalAnswers(value: unknown): WhimsicalAnswers {
  const parsed = WhimsicalAnswersSchema.safeParse(value);
  if (!parsed.success) {
    throw new BadRequestException({
      code: 'whimsical_invalid',
      issues: parsed.error.issues.map((i) => ({ path: i.path, message: i.message })),
    });
  }
  return parsed.data;
}

/**
 * Convenience — narrow `Prisma.JsonValue` to `WhimsicalAnswers` or `null`
 * without throwing. Use when a Profile row is mid-onboarding and the JSON
 * may legitimately be partial.
 */
export function tryParseWhimsicalAnswers(value: Prisma.JsonValue | null): WhimsicalAnswers | null {
  if (value == null) return null;
  const parsed = WhimsicalAnswersSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}
