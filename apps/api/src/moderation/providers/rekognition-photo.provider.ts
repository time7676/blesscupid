import { Injectable, Logger } from '@nestjs/common';
import {
  RekognitionClient,
  DetectFacesCommand,
  DetectModerationLabelsCommand,
} from '@aws-sdk/client-rekognition';

const UNSAFE_PARENTS = new Set(['Explicit Nudity', 'Suggestive', 'Violence']);

let cachedClient: RekognitionClient | null = null;

function getClient(): RekognitionClient {
  if (cachedClient) return cachedClient;
  const region = process.env.AWS_REGION;
  if (!region) {
    throw new Error('AWS_REGION not set');
  }
  cachedClient = new RekognitionClient({ region });
  return cachedClient;
}

function getBucket(): string {
  const bucket = process.env.PHOTO_BUCKET;
  if (!bucket) {
    throw new Error('PHOTO_BUCKET not set');
  }
  return bucket;
}

@Injectable()
export class RekognitionPhotoModerator {
  private readonly logger = new Logger(RekognitionPhotoModerator.name);

  async detectFaces(s3Key: string): Promise<{ faces: { confidence: number; areaRatio: number }[] }> {
    const client = getClient();
    const out = await client.send(
      new DetectFacesCommand({
        Image: { S3Object: { Bucket: getBucket(), Name: s3Key } },
        Attributes: ['DEFAULT'],
      }),
    );
    const faces = (out.FaceDetails ?? []).map((f) => {
      const bbox = f.BoundingBox ?? {};
      const w = bbox.Width ?? 0;
      const h = bbox.Height ?? 0;
      const areaRatio = Math.max(0, Math.min(1, w * h));
      const confidence = (f.Confidence ?? 0) / 100;
      return { confidence, areaRatio };
    });
    return { faces };
  }

  async detectUnsafeLabels(s3Key: string): Promise<string[]> {
    const client = getClient();
    const out = await client.send(
      new DetectModerationLabelsCommand({
        Image: { S3Object: { Bucket: getBucket(), Name: s3Key } },
        MinConfidence: 60,
      }),
    );
    const flagged = new Set<string>();
    for (const label of out.ModerationLabels ?? []) {
      const name = label.Name;
      const parent = label.ParentName;
      if (parent && UNSAFE_PARENTS.has(parent) && name) flagged.add(name);
      else if (name && UNSAFE_PARENTS.has(name)) flagged.add(name);
    }
    return [...flagged];
  }
}
