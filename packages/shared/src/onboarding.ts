import { z } from 'zod';

// ---------------------------------------------------------------------------
// Auth payloads (signup / login / OAuth) — kept across the v1-restart since
// auth flow shape didn't change.
// ---------------------------------------------------------------------------

export const LocaleSchema = z.enum(['en', 'id']);
export type LocaleCode = z.infer<typeof LocaleSchema>;

export const SignupEmailSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(200),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD'),
  locale: LocaleSchema.optional(),
});
export type SignupEmailInput = z.infer<typeof SignupEmailSchema>;

export const LoginEmailSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginEmailInput = z.infer<typeof LoginEmailSchema>;

export const OAuthProviderSchema = z.enum(['apple', 'google']);
export type OAuthProvider = z.infer<typeof OAuthProviderSchema>;

export const OAuthSignupSchema = z.object({
  provider: OAuthProviderSchema,
  idToken: z.string().min(20),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  locale: LocaleSchema.optional(),
});
export type OAuthSignupInput = z.infer<typeof OAuthSignupSchema>;

export const OAuthLoginSchema = z.object({
  provider: OAuthProviderSchema,
  idToken: z.string().min(20),
});
export type OAuthLoginInput = z.infer<typeof OAuthLoginSchema>;

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(20),
});
export type RefreshTokenInput = z.infer<typeof RefreshTokenSchema>;

export const PasswordResetRequestSchema = z.object({
  email: z.string().email(),
});
export type PasswordResetRequestInput = z.infer<typeof PasswordResetRequestSchema>;

export const PasswordResetConfirmSchema = z.object({
  email: z.string().email(),
  code: z.string().regex(/^\d{6}$/, '6-digit numeric'),
  newPassword: z.string().min(8).max(200),
});
export type PasswordResetConfirmInput = z.infer<typeof PasswordResetConfirmSchema>;

export const EmailVerifyConfirmSchema = z.object({
  code: z.string().regex(/^\d{6}$/, '6-digit numeric'),
});
export type EmailVerifyConfirmInput = z.infer<typeof EmailVerifyConfirmSchema>;

// Bumped to v1.0 for v1-restart per plan
// (~/.claude/plans/i-think-we-need-misty-eclipse.md §"Holy Code version").
// All re-signups must accept fresh.
export const COVENANT_VERSION = 'v1.0';

export const CovenantAcceptSchema = z.object({
  version: z.string().min(1),
  acceptedAt: z.string().datetime(),
});
export type CovenantAcceptInput = z.infer<typeof CovenantAcceptSchema>;

// ---------------------------------------------------------------------------
// 8-card onboarding (v1-restart)
// ---------------------------------------------------------------------------
//
// See plan `~/.claude/plans/i-think-we-need-misty-eclipse.md` §"8-card
// onboarding". Each card POSTs to `/onboarding/step/:n`. Whimsical answers
// (q1, q3, q5, q7) collected on cards 1/3/5/7 land in
// `Profile.whimsicalAnswers` JSON for soft tiebreaker scoring + chat hooks.

// Domain enums — wire-format strings match the Prisma enums in
// apps/api/prisma/schema.prisma (Gender, Tradition).

export const OnboardingGenderSchema = z.enum(['male', 'female']);
export type OnboardingGender = z.infer<typeof OnboardingGenderSchema>;

export const OnboardingTraditionSchema = z.enum([
  'catholic',
  'protestant',
  'orthodox',
  'nondenom',
]);
export type OnboardingTradition = z.infer<typeof OnboardingTraditionSchema>;

// Whimsical question option enums (cards 1, 3, 5, 7).

export const WhimsicalQ1AnimalSchema = z.enum(['elephant', 'mouse', 'dolphin', 'owl']);
export type WhimsicalQ1Animal = z.infer<typeof WhimsicalQ1AnimalSchema>;

export const WhimsicalQ3SundaySchema = z.enum([
  'full_pew',
  'kitchen_prayer',
  'mountain_trail',
  'candle_alone',
]);
export type WhimsicalQ3Sunday = z.infer<typeof WhimsicalQ3SundaySchema>;

export const WhimsicalQ5AfternoonSchema = z.enum(['rest', 'serve', 'create', 'study']);
export type WhimsicalQ5Afternoon = z.infer<typeof WhimsicalQ5AfternoonSchema>;

// Q7 = verse ref (e.g. "John 3:16"). Free-form ref string, capped to keep
// the JSON column tidy. Validated against the curated 84-pool at the
// service layer, not here.
export const WhimsicalQ7VerseRefSchema = z.string().min(2).max(40);

// Whimsical question identifier — exported so other modules
// (e.g. matching cosine vector mapping) can key off the same names.
export const WhimsicalQuestionSchema = z.enum(['q1', 'q3', 'q5', 'q7']);
export type WhimsicalQuestion = z.infer<typeof WhimsicalQuestionSchema>;

/**
 * Canonical shape of `Profile.whimsicalAnswers` JSON. Strict — no extra keys.
 * Validated by `whimsical-validation.ts` on every Profile.update.
 */
export const WhimsicalAnswersSchema = z
  .object({
    q1: WhimsicalQ1AnimalSchema,
    q3: WhimsicalQ3SundaySchema,
    q5: WhimsicalQ5AfternoonSchema,
    q7: WhimsicalQ7VerseRefSchema,
  })
  .strict();
export type WhimsicalAnswers = z.infer<typeof WhimsicalAnswersSchema>;

// Per-step payload schemas. Each one is the body of POST /onboarding/step/:n.

export const OnboardingStep1BodySchema = z.object({
  q1: WhimsicalQ1AnimalSchema,
});
export type OnboardingStep1Body = z.infer<typeof OnboardingStep1BodySchema>;

export const OnboardingStep2BodySchema = z.object({
  displayName: z.string().min(2).max(40),
  // ISO-8601 date string — server enforces ≥18y at submit.
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD'),
});
export type OnboardingStep2Body = z.infer<typeof OnboardingStep2BodySchema>;

export const OnboardingStep3BodySchema = z.object({
  q3: WhimsicalQ3SundaySchema,
});
export type OnboardingStep3Body = z.infer<typeof OnboardingStep3BodySchema>;

export const OnboardingStep4BodySchema = z.object({
  gender: OnboardingGenderSchema,
  seeking: OnboardingGenderSchema,
  tradition: OnboardingTraditionSchema,
});
export type OnboardingStep4Body = z.infer<typeof OnboardingStep4BodySchema>;

export const OnboardingStep5BodySchema = z.object({
  q5: WhimsicalQ5AfternoonSchema,
});
export type OnboardingStep5Body = z.infer<typeof OnboardingStep5BodySchema>;

// Card 6 — Location + home church.
// Either GPS lat+lng OR a city dropdown selection is required. The
// service-side `assertStepValid` enforces this; schema-level we allow both.
export const OnboardingStep6BodySchema = z
  .object({
    lat: z.number().gte(-90).lte(90).optional(),
    lng: z.number().gte(-180).lte(180).optional(),
    city: z.string().min(1).max(80),
    countryCode: z.string().length(2),
    homeChurchName: z.string().min(1).max(120).optional(),
    churchLat: z.number().gte(-90).lte(90).optional(),
    churchLng: z.number().gte(-180).lte(180).optional(),
  })
  .superRefine((value, ctx) => {
    // lat+lng must be paired
    if ((value.lat == null) !== (value.lng == null)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['lat'],
        message: 'lat_lng_must_be_paired',
      });
    }
    if ((value.churchLat == null) !== (value.churchLng == null)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['churchLat'],
        message: 'church_lat_lng_must_be_paired',
      });
    }
  });
export type OnboardingStep6Body = z.infer<typeof OnboardingStep6BodySchema>;

export const OnboardingStep7BodySchema = z.object({
  // Verse ref selected by user (e.g. "Psalm 23:1"). Stored as the user's
  // first StatusVerse + as `whimsicalAnswers.q7` for affinity scoring.
  verseRef: WhimsicalQ7VerseRefSchema,
  q7: WhimsicalQ7VerseRefSchema,
});
export type OnboardingStep7Body = z.infer<typeof OnboardingStep7BodySchema>;

export const OnboardingStep8BodySchema = z.object({
  photoStorageKey: z.string().min(1).max(255),
  bio: z.string().max(140).optional(),
  // Literal `true` — onboarding cannot complete without explicit accept.
  covenantAccepted: z.literal(true),
});
export type OnboardingStep8Body = z.infer<typeof OnboardingStep8BodySchema>;

/**
 * Discriminated union of every step body, keyed by `step`. Convenient for
 * client-side helpers that send a generic envelope. The HTTP route currently
 * takes the body directly per `:n`, this union is for typing the bag.
 */
export type OnboardingStepBody =
  | ({ step: 1 } & OnboardingStep1Body)
  | ({ step: 2 } & OnboardingStep2Body)
  | ({ step: 3 } & OnboardingStep3Body)
  | ({ step: 4 } & OnboardingStep4Body)
  | ({ step: 5 } & OnboardingStep5Body)
  | ({ step: 6 } & OnboardingStep6Body)
  | ({ step: 7 } & OnboardingStep7Body)
  | ({ step: 8 } & OnboardingStep8Body);

// Step ordering — Profile.onboardingStep is an Int (0..8). 0 = nothing
// captured yet; 8 = card 8 saved; complete flips User.onboardingCompleted.
export const ONBOARDING_TOTAL_STEPS = 8 as const;

export const ONBOARDING_LIMITS = {
  displayNameMin: 2,
  displayNameMax: 40,
  bioMax: 140,
  homeChurchNameMax: 120,
  cityMax: 80,
  minAgeYears: 18,
} as const;

/**
 * Server-side response shape for `GET /onboarding/state`. Mobile reads
 * `currentStep` to resume mid-flow.
 */
export interface OnboardingStateResponse {
  currentStep: number; // 0..8
  isComplete: boolean;
  capturedFields: {
    displayName?: string;
    dob?: string;
    gender?: OnboardingGender;
    seeking?: OnboardingGender;
    tradition?: OnboardingTradition;
    city?: string;
    countryCode?: string;
    homeChurchName?: string;
    photoCount: number;
    covenantSigned: boolean;
    whimsicalKeys: WhimsicalQuestion[];
  };
}
