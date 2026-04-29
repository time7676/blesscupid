import { describe, expect, it } from 'vitest';
import { categorize, route, routeFromReason } from './routing.js';

describe('moderation routing (BLE-63 / A.4)', () => {
  it('underage → minor → ceo_p0 + auto-lock + bypass classifiers', () => {
    const d = routeFromReason('underage');
    expect(d.category).toBe('minor');
    expect(d.queue).toBe('ceo_p0');
    expect(d.bypassClassifiers).toBe(true);
    expect(d.autoLockAccount).toBe(true);
  });

  it('harassment → abuse → ceo_p0, no auto-lock, can auto-suspend', () => {
    const d = routeFromReason('harassment');
    expect(d.category).toBe('abuse');
    expect(d.queue).toBe('ceo_p0');
    expect(d.autoSuspendAllowed).toBe(true);
    expect(d.autoLockAccount).toBe(false);
  });

  it('suicidal → ceo_p0, NEVER auto-suspend (A.4 explicit exception)', () => {
    const d = route('suicidal');
    expect(d.queue).toBe('ceo_p0');
    expect(d.autoSuspendAllowed).toBe(false);
  });

  it('other reasons → mod_triage, no bypass, no auto-lock', () => {
    expect(categorize('sexual_content')).toBe('other');
    expect(categorize('scam_or_spam')).toBe('other');
    expect(categorize('off_platform_pressure')).toBe('other');
    expect(categorize('fake_profile')).toBe('other');
    expect(categorize('other')).toBe('other');

    const d = routeFromReason('sexual_content');
    expect(d.queue).toBe('mod_triage');
    expect(d.bypassClassifiers).toBe(false);
    expect(d.autoLockAccount).toBe(false);
  });

  it('every category routes to a real queue (no fall-through)', () => {
    const cats: Array<'abuse' | 'suicidal' | 'minor' | 'other'> = [
      'abuse',
      'suicidal',
      'minor',
      'other',
    ];
    for (const c of cats) expect(route(c).category).toBe(c);
  });
});
