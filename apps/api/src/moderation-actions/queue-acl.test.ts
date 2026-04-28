import { describe, expect, it } from 'vitest';
import { canAccessQueue, isAppealReviewerEligible } from './queue-acl.js';

describe('queue-acl (BLE-63 / A.5)', () => {
  it('ceo_p0: ceo + pastor allow, every other role deny', () => {
    expect(canAccessQueue('ceo', 'ceo_p0')).toBe('allow');
    expect(canAccessQueue('pastor', 'ceo_p0')).toBe('allow');
    expect(canAccessQueue('member', 'ceo_p0')).toBe('deny');
  });

  it('mod_triage / mod_appeals / pastor_precedent: ceo + pastor allow, member deny', () => {
    for (const q of ['mod_triage', 'mod_appeals', 'pastor_precedent'] as const) {
      expect(canAccessQueue('ceo', q)).toBe('allow');
      expect(canAccessQueue('pastor', q)).toBe('allow');
      expect(canAccessQueue('member', q)).toBe('deny');
    }
  });

  it('appeal reviewer: cannot be the original actor', () => {
    expect(isAppealReviewerEligible('a', 'a')).toBe(false);
    expect(isAppealReviewerEligible('a', 'b')).toBe(true);
  });
});
