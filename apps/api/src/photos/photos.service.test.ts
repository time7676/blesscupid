import { describe, it, expect, beforeEach } from 'vitest';
import { PhotosService } from './photos.service.js';

interface FakePhoto {
  id: string;
  userId: string;
  storageKey: string;
  position: number;
  status: string;
  faceCount: number | null;
  faceAreaRatio: number | null;
  rejectionReasons: string[];
  unsafeLabels: string[];
}

interface FakeModerationItem {
  userId: string | null;
  kind: string;
  subjectId: string | null;
  rawContent: string | null;
  decision: string;
  status: string;
  categories: string[];
  provider: string;
}

function makeFakes() {
  const photos = new Map<string, FakePhoto>();
  const moderationItems: FakeModerationItem[] = [];
  const prisma = {
    photo: {
      create: async ({ data }: { data: FakePhoto }) => {
        photos.set(data.id, { ...data });
        return data;
      },
      findUnique: async ({ where: { id } }: { where: { id: string } }) =>
        photos.get(id) ?? null,
      update: async ({ where: { id }, data }: { where: { id: string }; data: Partial<FakePhoto> }) => {
        const cur = photos.get(id);
        if (!cur) throw new Error('not found');
        const next = { ...cur, ...data };
        photos.set(id, next);
        return next;
      },
    },
    moderationItem: {
      create: async ({ data }: { data: FakeModerationItem }) => {
        moderationItems.push(data);
        return data;
      },
    },
  };
  return { prisma, photos, moderationItems };
}

const storage = {
  createPresignedPut: async (key: string) => ({
    uploadUrl: `https://s3.test/${key}?sig=fake`,
    expiresIn: 300,
  }),
};

function svc(
  faces: { confidence: number; areaRatio: number }[],
  unsafe: string[],
  fakes: ReturnType<typeof makeFakes>,
) {
  const moderation = {
    moderate: async () => {
      const reasons: string[] = [];
      if (faces.length === 0) reasons.push('no_face_detected');
      if (faces.length > 1) reasons.push('multiple_faces');
      if (faces.some((f) => f.confidence < 0.9)) reasons.push('low_confidence');
      const largest = faces.reduce((m, f) => Math.max(m, f.areaRatio), 0);
      if (faces.length > 0 && largest < 0.08) reasons.push('face_too_small');
      const passes = reasons.length === 0;
      const decision = unsafe.length > 0 ? 'block' : passes ? 'allow' : 'review';
      return {
        face: { faceCount: faces.length, largestFaceAreaRatio: largest, hasFace: faces.length > 0, passes, reasons },
        unsafeLabels: unsafe,
        decision,
      };
    },
  };
  return new PhotosService(fakes.prisma as never, moderation as never, storage as never);
}

describe('PhotosService.finalize', () => {
  let fakes: ReturnType<typeof makeFakes>;
  const userId = 'u1';
  const photoId = 'p1';

  beforeEach(async () => {
    fakes = makeFakes();
    fakes.photos.set(photoId, {
      id: photoId,
      userId,
      storageKey: `users/${userId}/photos/${photoId}.jpg`,
      position: 0,
      status: 'uploaded',
      faceCount: null,
      faceAreaRatio: null,
      rejectionReasons: [],
      unsafeLabels: [],
    });
  });

  it('approves valid face photo', async () => {
    const s = svc([{ confidence: 0.99, areaRatio: 0.2 }], [], fakes);
    const r = await s.finalize(userId, photoId);
    expect(r.status).toBe('approved');
    expect(fakes.photos.get(photoId)?.status).toBe('approved');
    expect(fakes.moderationItems).toHaveLength(0);
  });

  it('rejects body-only photo with face_too_small', async () => {
    const s = svc([{ confidence: 0.99, areaRatio: 0.02 }], [], fakes);
    await expect(s.finalize(userId, photoId)).rejects.toMatchObject({
      response: { code: 'photo_rejected', reasons: expect.arrayContaining(['face_too_small']) },
    });
    expect(fakes.photos.get(photoId)?.status).toBe('rejected');
    // face-failure path does NOT create a ModerationItem (user retry, not audit).
    expect(fakes.moderationItems).toHaveLength(0);
  });

  it('blocks unsafe-label photo + writes ModerationItem', async () => {
    const s = svc([{ confidence: 0.99, areaRatio: 0.2 }], ['ExplicitNudity'], fakes);
    await expect(s.finalize(userId, photoId)).rejects.toMatchObject({
      response: { code: 'photo_rejected', unsafeLabels: ['ExplicitNudity'] },
    });
    expect(fakes.photos.get(photoId)?.status).toBe('rejected');
    expect(fakes.moderationItems).toHaveLength(1);
    expect(fakes.moderationItems[0]).toMatchObject({
      kind: 'photo',
      decision: 'block',
      categories: ['ExplicitNudity'],
      provider: 'rekognition',
    });
  });

  it('rejects multiple faces (hard rule) without ModerationItem', async () => {
    const s = svc(
      [
        { confidence: 0.99, areaRatio: 0.2 },
        { confidence: 0.99, areaRatio: 0.15 },
      ],
      [],
      fakes,
    );
    await expect(s.finalize(userId, photoId)).rejects.toMatchObject({
      response: { reasons: expect.arrayContaining(['multiple_faces']) },
    });
    expect(fakes.moderationItems).toHaveLength(0);
  });
});
