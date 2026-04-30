import { setup, assign } from 'xstate';

export type Mode = 'pacaran' | 'persahabatan' | 'komunitas';
export type MarriageTimeline = 'within_1y' | '1_to_3y' | 'over_3y' | 'unsure';

export type Denomination =
  | 'katolik'
  | 'protestan_umum'
  | 'kharismatik'
  | 'pentakosta'
  | 'injili'
  | 'reformed'
  | 'baptis'
  | 'methodis'
  | 'advent'
  | 'ortodoks'
  | 'lainnya';

export type ServingArea =
  | 'pujian'
  | 'musik'
  | 'sekolah_minggu'
  | 'pemuda'
  | 'doa'
  | 'misi'
  | 'multimedia'
  | 'diakonia'
  | 'lainnya';

export type FaithProfile = {
  denomination: Denomination;
  denominationOther?: string;
  homeChurch?: string;
  favoriteVerse: string;
  faithJourney?: string;
  servingAreas: ServingArea[];
};

export type OnboardingContext = {
  authMethod?: 'phone' | 'email';
  authIdentifier?: string;
  authVerified: boolean;
  selectedModes: Mode[];
  faithStatementAgreedAt?: string;
  photoUploadId?: string;
  selfieLivenessId?: string;
  faithProfile: Partial<FaithProfile>;
  marriageTimeline?: MarriageTimeline;
  completedAt?: string;
};

export type OnboardingEvent =
  | { type: 'BEGIN' }
  | { type: 'AUTH_METHOD_SELECTED'; method: 'phone' | 'email' }
  | { type: 'KIRIM_KODE'; identifier: string }
  | { type: 'OTP_VERIFIED' }
  | { type: 'MODES_CHANGED'; modes: Mode[] }
  | { type: 'LANJUT' }
  | { type: 'AGREE'; agreedAt: string }
  | { type: 'PHOTO_OK'; photoUploadId: string }
  | { type: 'LIVENESS_OK'; selfieLivenessId: string }
  | { type: 'FAITH_PROFILE_CHANGED'; partial: Partial<FaithProfile> }
  | { type: 'MARRIAGE_TIMELINE_CHANGED'; value: MarriageTimeline }
  | { type: 'START_EXPLORE' }
  | { type: 'BACK' }
  | { type: 'HYDRATE'; snapshot: { value: string; context: OnboardingContext } };

export const initialContext: OnboardingContext = {
  authVerified: false,
  selectedModes: [],
  faithProfile: {},
};

const requiresPacaranBranch = (ctx: OnboardingContext) =>
  ctx.selectedModes.includes('pacaran');

const faithProfileComplete = (ctx: OnboardingContext) =>
  Boolean(ctx.faithProfile.denomination) &&
  Boolean(ctx.faithProfile.favoriteVerse) &&
  (ctx.faithProfile.favoriteVerse?.length ?? 0) <= 180;

export const onboardingMachine = setup({
  types: {
    context: {} as OnboardingContext,
    events: {} as OnboardingEvent,
  },
  guards: {
    hasIdentifier: ({ event }) =>
      event.type === 'KIRIM_KODE' && Boolean(event.identifier?.trim()),
    hasModeSelection: ({ context }) =>
      context.selectedModes.length >= 1 && context.selectedModes.length <= 3,
    hasAgreedAt: ({ context }) => Boolean(context.faithStatementAgreedAt),
    hasPhotoId: ({ context }) => Boolean(context.photoUploadId),
    hasLivenessId: ({ context }) => Boolean(context.selfieLivenessId),
    hasFaithProfile: ({ context }) => faithProfileComplete(context),
    hasMarriageTimeline: ({ context }) => Boolean(context.marriageTimeline),
    needsMarriageTimeline: ({ context }) => requiresPacaranBranch(context),
  },
  actions: {
    setAuthMethod: assign({
      authMethod: ({ event }) =>
        event.type === 'AUTH_METHOD_SELECTED' ? event.method : undefined,
    }),
    setIdentifier: assign({
      authIdentifier: ({ event }) =>
        event.type === 'KIRIM_KODE' ? event.identifier.trim() : undefined,
    }),
    markVerified: assign({ authVerified: () => true }),
    setModes: assign({
      selectedModes: ({ event, context }) =>
        event.type === 'MODES_CHANGED' ? event.modes : context.selectedModes,
    }),
    setAgreedAt: assign({
      faithStatementAgreedAt: ({ event, context }) =>
        event.type === 'AGREE' ? event.agreedAt : context.faithStatementAgreedAt,
    }),
    setPhotoId: assign({
      photoUploadId: ({ event, context }) =>
        event.type === 'PHOTO_OK' ? event.photoUploadId : context.photoUploadId,
    }),
    setLivenessId: assign({
      selfieLivenessId: ({ event, context }) =>
        event.type === 'LIVENESS_OK'
          ? event.selfieLivenessId
          : context.selfieLivenessId,
    }),
    mergeFaithProfile: assign({
      faithProfile: ({ event, context }) =>
        event.type === 'FAITH_PROFILE_CHANGED'
          ? { ...context.faithProfile, ...event.partial }
          : context.faithProfile,
    }),
    setMarriageTimeline: assign({
      marriageTimeline: ({ event, context }) =>
        event.type === 'MARRIAGE_TIMELINE_CHANGED'
          ? event.value
          : context.marriageTimeline,
    }),
    markCompleted: assign({
      completedAt: () => new Date().toISOString(),
    }),
  },
}).createMachine({
  id: 'onboarding',
  initial: 'welcome',
  context: initialContext,
  on: {
    HYDRATE: {
      // Hydration handled by `useMachine`'s state restore.
      // Listed here so callers can dispatch HYDRATE for resume flows.
    },
  },
  states: {
    welcome: {
      on: { BEGIN: 'auth_entry' },
    },
    auth_entry: {
      on: {
        AUTH_METHOD_SELECTED: { actions: 'setAuthMethod' },
        KIRIM_KODE: {
          guard: 'hasIdentifier',
          target: 'auth_otp',
          actions: 'setIdentifier',
        },
        BACK: 'welcome',
      },
    },
    auth_otp: {
      on: {
        OTP_VERIFIED: { target: 'mode_pick', actions: 'markVerified' },
        BACK: 'auth_entry',
      },
    },
    mode_pick: {
      on: {
        MODES_CHANGED: { actions: 'setModes' },
        LANJUT: { guard: 'hasModeSelection', target: 'faith_statement' },
        BACK: 'auth_otp',
      },
    },
    faith_statement: {
      on: {
        AGREE: { actions: 'setAgreedAt' },
        LANJUT: { guard: 'hasAgreedAt', target: 'photo_upload' },
        BACK: 'mode_pick',
      },
    },
    photo_upload: {
      on: {
        PHOTO_OK: { target: 'selfie_liveness', actions: 'setPhotoId' },
        BACK: 'faith_statement',
      },
    },
    selfie_liveness: {
      on: {
        LIVENESS_OK: { target: 'faith_profile', actions: 'setLivenessId' },
        BACK: 'photo_upload',
      },
    },
    faith_profile: {
      on: {
        FAITH_PROFILE_CHANGED: { actions: 'mergeFaithProfile' },
        LANJUT: [
          {
            guard: 'needsMarriageTimeline',
            target: 'marriage_timeline',
          },
          {
            guard: 'hasFaithProfile',
            target: 'done',
            actions: 'markCompleted',
          },
        ],
        BACK: 'selfie_liveness',
      },
    },
    marriage_timeline: {
      on: {
        MARRIAGE_TIMELINE_CHANGED: { actions: 'setMarriageTimeline' },
        LANJUT: {
          guard: 'hasMarriageTimeline',
          target: 'done',
          actions: 'markCompleted',
        },
        BACK: 'faith_profile',
      },
    },
    done: {
      on: { START_EXPLORE: 'completed' },
    },
    completed: { type: 'final' },
  },
});

export const STEP_ORDER = [
  'welcome',
  'auth_entry',
  'auth_otp',
  'mode_pick',
  'faith_statement',
  'photo_upload',
  'selfie_liveness',
  'faith_profile',
  'marriage_timeline',
  'done',
] as const;

export type OnboardingStep = (typeof STEP_ORDER)[number];

export const visibleStepIndex = (
  step: OnboardingStep,
  ctx: OnboardingContext,
): { current: number; total: number } => {
  const skipMarriage = !requiresPacaranBranch(ctx);
  const filtered = STEP_ORDER.filter(
    (s) => !(s === 'marriage_timeline' && skipMarriage),
  );
  const idx = filtered.indexOf(step);
  return { current: Math.max(idx, 0) + 1, total: filtered.length };
};
