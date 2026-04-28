import { describe, it, expect } from 'vitest';
import { PhotoModerationService } from './photo-moderation.service.js';

const stubProvider = {
  detectFaces: async (_: string) => ({ faces: [] }),
  detectUnsafeLabels: async (_: string) => [] as string[],
};

function svc(faces: { confidence: number; areaRatio: number }[], unsafe: string[] = []) {
  return new PhotoModerationService({
    detectFaces: async () => ({ faces }),
    detectUnsafeLabels: async () => unsafe,
  } as never);
}

describe('PhotoModerationService.evaluateFace (via moderate)', () => {
  it('rejects no-face photo with no_face_detected', async () => {
    const r = await svc([]).moderate('k');
    expect(r.face.passes).toBe(false);
    expect(r.face.reasons).toContain('no_face_detected');
    expect(r.decision).toBe('review');
  });

  it('rejects face_too_small (body-only photo proxy)', async () => {
    const r = await svc([{ confidence: 0.99, areaRatio: 0.02 }]).moderate('k');
    expect(r.face.reasons).toContain('face_too_small');
    expect(r.decision).toBe('review');
  });

  it('rejects multiple faces', async () => {
    const r = await svc([
      { confidence: 0.99, areaRatio: 0.2 },
      { confidence: 0.99, areaRatio: 0.15 },
    ]).moderate('k');
    expect(r.face.reasons).toContain('multiple_faces');
  });

  it('rejects low confidence', async () => {
    const r = await svc([{ confidence: 0.5, areaRatio: 0.2 }]).moderate('k');
    expect(r.face.reasons).toContain('low_confidence');
  });

  it('allows valid single high-confidence face >=8%', async () => {
    const r = await svc([{ confidence: 0.99, areaRatio: 0.12 }]).moderate('k');
    expect(r.face.passes).toBe(true);
    expect(r.decision).toBe('allow');
  });

  it('blocks unsafe labels regardless of face', async () => {
    const r = await svc([{ confidence: 0.99, areaRatio: 0.2 }], ['ExplicitNudity']).moderate('k');
    expect(r.decision).toBe('block');
  });

  it('stub provider unused has no effect', () => {
    expect(stubProvider).toBeDefined();
  });
});
