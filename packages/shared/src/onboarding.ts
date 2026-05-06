import { z } from 'zod';
import { FaithProfileSchema, GenderSchema } from './domain.js';

export const SignupEmailSchema = z.object({
  email: z.string().email(),
  password: z.string().min(10).max(200),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD'),
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
});
export type OAuthSignupInput = z.infer<typeof OAuthSignupSchema>;

// Bumped to v1 for BLE-124 — Pastor signed verbatim covenant body
// (see /BLE/issues/BLE-41#document-user-covenant). Existing users with
// `v0-placeholder` must re-accept before re-entering the surface.
export const COVENANT_VERSION = 'v1';

export const CovenantAcceptSchema = z.object({
  version: z.string().min(1),
  acceptedAt: z.string().datetime(),
});
export type CovenantAcceptInput = z.infer<typeof CovenantAcceptSchema>;

// ---------------------------------------------------------------------------
// Onboarding questionnaire v1 (BLE-41 / BLE-124)
// ---------------------------------------------------------------------------

export const IntentSchema = z.enum(['dating', 'friendship', 'community', 'unspecified']);
export type Intent = z.infer<typeof IntentSchema>;

export const SeekingSchema = z.enum(['woman', 'man', 'same_sex', 'unspecified']);
export type Seeking = z.infer<typeof SeekingSchema>;

export const TraditionSchema = z.enum([
  'catholic',
  'protestant_evangelical',
  'protestant_pentecostal',
  'protestant_reformed',
  'protestant_mainline',
  'orthodox',
  'other_christian',
  'still_figuring',
]);
export type Tradition = z.infer<typeof TraditionSchema>;

export const WalkStageSchema = z.enum([
  'lifelong',
  'came_later',
  'recent_convert',
  'returning',
  'doubting_exploring',
  'prefer_not_to_say',
]);
export type WalkStage = z.infer<typeof WalkStageSchema>;

export const MarriageOpenSchema = z.enum(['yes', 'maybe', 'no']);
export type MarriageOpen = z.infer<typeof MarriageOpenSchema>;

export const WelcomedTagSchema = z.enum([
  'previously_married',
  'single_parent',
  'widowed',
  'convert_from_non_christian',
  'church_hurt',
]);
export type WelcomedTag = z.infer<typeof WelcomedTagSchema>;

export const PracticeTagSchema = z.enum([
  'sunday_in_person',
  'sunday_online',
  'catholic_mass',
  'daily_prayer',
  'small_group',
  'worship_at_home',
  'still_finding_a_community',
]);
export type PracticeTag = z.infer<typeof PracticeTagSchema>;

export const Q3RedirectOutcomeSchema = z.enum(['accept_reroute', 'closed_by_user']);
export type Q3RedirectOutcome = z.infer<typeof Q3RedirectOutcomeSchema>;

const TRADITION_OTHER_MAX = 80;
const BIO_SEED_MAX = 280;

/**
 * Storage shape for the welcomed-tag visibility map. Default per-tag is
 * `false` per Holy Code §4.3 — never display without explicit user opt-in.
 */
export const WelcomedTagVisibilitySchema = z.record(WelcomedTagSchema, z.boolean());
export type WelcomedTagVisibility = z.infer<typeof WelcomedTagVisibilitySchema>;

/**
 * Single payload for `POST /onboarding/questionnaire` — replaces the legacy
 * faith-only payload. All optional questions can be omitted; required gates
 * (Q1 age, Q3 v1 dating scope) are enforced at server-side, not here.
 */
export const QuestionnaireSubmitSchema = z
  .object({
    // Q2 — required
    intent: IntentSchema,

    // Q3 — required only when intent === dating
    seeking: SeekingSchema.optional(),

    // Q4 — required
    tradition: TraditionSchema,
    traditionOther: z.string().min(1).max(TRADITION_OTHER_MAX).optional(),

    // Q5 — optional
    walkStage: WalkStageSchema.optional(),

    // Q6 — required when intent === dating
    marriageOpen: MarriageOpenSchema.optional(),

    // Q7 — optional, multi-select
    welcomedTags: z.array(WelcomedTagSchema).max(5).default([]),
    welcomedTagVisibility: WelcomedTagVisibilitySchema.default({}),

    // Q8 — optional, multi-select
    practiceTags: z.array(PracticeTagSchema).max(7).default([]),

    // Q9 — optional bio seed
    bioSeed: z.string().max(BIO_SEED_MAX).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.intent === 'dating') {
      if (!value.seeking) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['seeking'],
          message: 'seeking_required_for_dating',
        });
      }
      if (!value.marriageOpen) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['marriageOpen'],
          message: 'marriage_open_required_for_dating',
        });
      }
    }

    if (value.tradition === 'other_christian' && !value.traditionOther) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['traditionOther'],
        message: 'tradition_other_required',
      });
    }

    // Privacy-by-default: cannot mark a welcomed tag visible if it isn't
    // also in the welcomedTags array. Prevents "ghost-public" flags from
    // sneaking through when the client posts a stale visibility map.
    const tags = new Set(value.welcomedTags);
    for (const [tag, visible] of Object.entries(value.welcomedTagVisibility)) {
      if (visible && !tags.has(tag as WelcomedTag)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['welcomedTagVisibility', tag],
          message: 'visibility_for_unselected_tag',
        });
      }
    }
  });
export type QuestionnaireSubmitInput = z.infer<typeof QuestionnaireSubmitSchema>;

/** Q3 same-sex redirect handler. Never writes a same-sex match preference. */
export const Q3RedirectSchema = z.object({
  outcome: Q3RedirectOutcomeSchema,
});
export type Q3RedirectInput = z.infer<typeof Q3RedirectSchema>;

/** Per-tag visibility patch used by settings UI post-onboarding. */
export const WelcomedTagsUpdateSchema = z
  .object({
    welcomedTags: z.array(WelcomedTagSchema).max(5).optional(),
    welcomedTagVisibility: WelcomedTagVisibilitySchema.optional(),
  })
  .superRefine((value, ctx) => {
    if (value.welcomedTags && value.welcomedTagVisibility) {
      const tags = new Set(value.welcomedTags);
      for (const [tag, visible] of Object.entries(value.welcomedTagVisibility)) {
        if (visible && !tags.has(tag as WelcomedTag)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['welcomedTagVisibility', tag],
            message: 'visibility_for_unselected_tag',
          });
        }
      }
    }
  });
export type WelcomedTagsUpdateInput = z.infer<typeof WelcomedTagsUpdateSchema>;

// Legacy faith questionnaire payload (BLE-7) — kept until BLE-105 mobile
// surfaces fully migrate to the v1 questionnaire route. New code MUST use
// `QuestionnaireSubmitSchema`.
export const FaithQuestionnaireSchema = FaithProfileSchema;
export type FaithQuestionnaireInput = z.infer<typeof FaithQuestionnaireSchema>;

// `displayName` is the public NICKNAME visible to other users.
// `legalName` is PRIVATE — captured for safety/abuse-report routing,
// surfaced only on /v1/admin and /v1/safety endpoints. Per BLE eng-review
// 2026-05-06. Optional in the schema so legacy flows that already wrote
// a profile without legalName don't break — required at the mobile UI
// layer for v1 onboarding.
export const ProfileBasicsSchema = z.object({
  displayName: z.string().min(1).max(40),
  legalName: z.string().min(1).max(80).optional(),
  gender: GenderSchema,
  city: z.string().min(1).max(80),
  countryCode: z.string().length(2),
});
export type ProfileBasicsInput = z.infer<typeof ProfileBasicsSchema>;

export const BioSchema = z.object({
  bio: z.string().min(1).max(500),
});
export type BioInput = z.infer<typeof BioSchema>;

export const OnboardingStep = {
  ageGate: 'age_gate',
  covenant: 'covenant',
  faithQuestionnaire: 'faith_questionnaire',
  profileBasics: 'profile_basics',
  firstPhoto: 'first_photo',
  bio: 'bio',
  done: 'done',
} as const;
export type OnboardingStep = (typeof OnboardingStep)[keyof typeof OnboardingStep];

export const ONBOARDING_ORDER: OnboardingStep[] = [
  OnboardingStep.ageGate,
  OnboardingStep.covenant,
  OnboardingStep.faithQuestionnaire,
  OnboardingStep.profileBasics,
  OnboardingStep.firstPhoto,
  OnboardingStep.bio,
  OnboardingStep.done,
];

export const QUESTIONNAIRE_LIMITS = {
  traditionOtherMax: TRADITION_OTHER_MAX,
  bioSeedMax: BIO_SEED_MAX,
  welcomedTagsMax: 5,
  practiceTagsMax: 7,
} as const;
