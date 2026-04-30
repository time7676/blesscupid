import { createActor } from 'xstate';
import {
  onboardingMachine,
  visibleStepIndex,
} from '../onboardingMachine';

describe('onboardingMachine', () => {
  it('walks the Pacaran branch (8 visible steps)', () => {
    const actor = createActor(onboardingMachine).start();
    actor.send({ type: 'BEGIN' });
    actor.send({ type: 'AUTH_METHOD_SELECTED', method: 'phone' });
    actor.send({ type: 'KIRIM_KODE', identifier: '+6281234567890' });
    actor.send({ type: 'OTP_VERIFIED' });
    actor.send({ type: 'MODES_CHANGED', modes: ['pacaran'] });
    actor.send({ type: 'LANJUT' });
    actor.send({ type: 'AGREE', agreedAt: new Date().toISOString() });
    actor.send({ type: 'LANJUT' });
    actor.send({ type: 'PHOTO_OK', photoUploadId: 'a1' });
    actor.send({ type: 'LIVENESS_OK', selfieLivenessId: 'l1' });
    actor.send({
      type: 'FAITH_PROFILE_CHANGED',
      partial: { denomination: 'kharismatik', favoriteVerse: 'Yer 29:11' },
    });
    actor.send({ type: 'LANJUT' });
    expect(actor.getSnapshot().value).toBe('marriage_timeline');
    actor.send({ type: 'MARRIAGE_TIMELINE_CHANGED', value: 'within_1y' });
    actor.send({ type: 'LANJUT' });
    expect(actor.getSnapshot().value).toBe('done');
    actor.send({ type: 'START_EXPLORE' });
    expect(actor.getSnapshot().status).toBe('done');
  });

  it('skips marriage timeline when Pacaran not selected (Persahabatan-only branch)', () => {
    const actor = createActor(onboardingMachine).start();
    actor.send({ type: 'BEGIN' });
    actor.send({ type: 'KIRIM_KODE', identifier: '+6281234567890' });
    actor.send({ type: 'OTP_VERIFIED' });
    actor.send({ type: 'MODES_CHANGED', modes: ['persahabatan'] });
    actor.send({ type: 'LANJUT' });
    actor.send({ type: 'AGREE', agreedAt: new Date().toISOString() });
    actor.send({ type: 'LANJUT' });
    actor.send({ type: 'PHOTO_OK', photoUploadId: 'a1' });
    actor.send({ type: 'LIVENESS_OK', selfieLivenessId: 'l1' });
    actor.send({
      type: 'FAITH_PROFILE_CHANGED',
      partial: { denomination: 'reformed', favoriteVerse: 'Roma 8:28' },
    });
    actor.send({ type: 'LANJUT' });
    expect(actor.getSnapshot().value).toBe('done');
  });

  it('BACK never loses context (Forgiveness)', () => {
    const actor = createActor(onboardingMachine).start();
    actor.send({ type: 'BEGIN' });
    actor.send({ type: 'AUTH_METHOD_SELECTED', method: 'email' });
    actor.send({ type: 'KIRIM_KODE', identifier: 'a@b.id' });
    actor.send({ type: 'OTP_VERIFIED' });
    actor.send({ type: 'MODES_CHANGED', modes: ['pacaran', 'komunitas'] });
    actor.send({ type: 'BACK' });
    actor.send({ type: 'BACK' });
    expect(actor.getSnapshot().value).toBe('auth_entry');
    expect(actor.getSnapshot().context.selectedModes).toEqual([
      'pacaran',
      'komunitas',
    ]);
    expect(actor.getSnapshot().context.authMethod).toBe('email');
  });

  it('rejects empty mode selection on LANJUT from mode_pick', () => {
    const actor = createActor(onboardingMachine).start();
    actor.send({ type: 'BEGIN' });
    actor.send({ type: 'KIRIM_KODE', identifier: '+6281234567890' });
    actor.send({ type: 'OTP_VERIFIED' });
    actor.send({ type: 'LANJUT' }); // no modes
    expect(actor.getSnapshot().value).toBe('mode_pick');
  });

  it('progress dots count 9 for Pacaran branch and 8 for Persahabatan-only', () => {
    expect(
      visibleStepIndex('mode_pick', {
        authVerified: true,
        selectedModes: ['pacaran'],
        faithProfile: {},
      }).total,
    ).toBe(10);
    expect(
      visibleStepIndex('mode_pick', {
        authVerified: true,
        selectedModes: ['persahabatan'],
        faithProfile: {},
      }).total,
    ).toBe(9);
  });
});
