import type { OnboardingContext } from './onboardingMachine';

export const shouldRenderMarriageTimeline = (ctx: OnboardingContext) =>
  ctx.selectedModes.includes('pacaran');

export const isFaithProfileSubmittable = (ctx: OnboardingContext) => {
  const fp = ctx.faithProfile;
  if (!fp.denomination) return false;
  if (fp.denomination === 'lainnya' && !fp.denominationOther?.trim()) return false;
  if (!fp.favoriteVerse?.trim()) return false;
  if ((fp.favoriteVerse?.length ?? 0) > 180) return false;
  if ((fp.faithJourney?.length ?? 0) > 500) return false;
  if ((fp.servingAreas?.length ?? 0) > 5) return false;
  return true;
};
