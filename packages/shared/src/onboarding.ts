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

export const COVENANT_VERSION = 'v0-placeholder';

export const CovenantAcceptSchema = z.object({
  version: z.string().min(1),
  acceptedAt: z.string().datetime(),
});
export type CovenantAcceptInput = z.infer<typeof CovenantAcceptSchema>;

export const FaithQuestionnaireSchema = FaithProfileSchema;
export type FaithQuestionnaireInput = z.infer<typeof FaithQuestionnaireSchema>;

export const ProfileBasicsSchema = z.object({
  displayName: z.string().min(1).max(40),
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
