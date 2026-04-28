// BLE-128 / BLE-63 — HCoC §4.2 trigger.
// Pure decision: does this user's declared gender + interest fall outside
// v1 man↔woman matching? When true, ProfileBasics (or whatever surface owns
// orientation) navigates to `OnboardingDatingOutOfScope`.

export type Gender = 'man' | 'woman';
export type Interest = 'men' | 'women';

export interface OrientationDeclaration {
  gender: Gender;
  interestedIn: Interest;
}

export function isDatingOutOfScope(o: OrientationDeclaration): boolean {
  if (o.gender === 'man' && o.interestedIn === 'women') return false;
  if (o.gender === 'woman' && o.interestedIn === 'men') return false;
  return true;
}
