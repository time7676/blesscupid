import {
  OnboardingStep1BodySchema,
  OnboardingStep2BodySchema,
  OnboardingStep3BodySchema,
  OnboardingStep4BodySchema,
  OnboardingStep5BodySchema,
  OnboardingStep6BodySchema,
  OnboardingStep7BodySchema,
  OnboardingStep8BodySchema,
  type OnboardingStep1Body,
  type OnboardingStep2Body,
  type OnboardingStep3Body,
  type OnboardingStep4Body,
  type OnboardingStep5Body,
  type OnboardingStep6Body,
  type OnboardingStep7Body,
  type OnboardingStep8Body,
} from '@blesscupid/shared';
import type { ZodSchema } from 'zod';

/**
 * Per-step Zod schema lookup for the 8-card onboarding flow. The controller
 * passes `STEP_SCHEMAS[n]` to `ZodValidate(...)`, so all step bodies share
 * the exact same validation pipeline + error shape.
 *
 * Plan: `~/.claude/plans/i-think-we-need-misty-eclipse.md` §"8-card
 * onboarding".
 */
export const STEP_SCHEMAS: Record<number, ZodSchema<unknown>> = {
  1: OnboardingStep1BodySchema,
  2: OnboardingStep2BodySchema,
  3: OnboardingStep3BodySchema,
  4: OnboardingStep4BodySchema,
  5: OnboardingStep5BodySchema,
  6: OnboardingStep6BodySchema,
  7: OnboardingStep7BodySchema,
  8: OnboardingStep8BodySchema,
};

export type StepBodyByNumber = {
  1: OnboardingStep1Body;
  2: OnboardingStep2Body;
  3: OnboardingStep3Body;
  4: OnboardingStep4Body;
  5: OnboardingStep5Body;
  6: OnboardingStep6Body;
  7: OnboardingStep7Body;
  8: OnboardingStep8Body;
};

export type AnyStepBody = StepBodyByNumber[keyof StepBodyByNumber];

export function isValidStepNumber(n: number): n is keyof StepBodyByNumber {
  return Number.isInteger(n) && n >= 1 && n <= 8;
}
