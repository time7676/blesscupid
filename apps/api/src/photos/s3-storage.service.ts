import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const PRESIGN_TTL_S = 300;

let cachedClient: S3Client | null = null;

function getClient(): S3Client {
  if (cachedClient) return cachedClient;
  const region = process.env.AWS_REGION;
  if (!region) throw new Error('AWS_REGION not set');
  cachedClient = new S3Client({ region });
  return cachedClient;
}

function getBucket(): string {
  const bucket = process.env.PHOTO_BUCKET;
  if (!bucket) throw new Error('PHOTO_BUCKET not set');
  return bucket;
}

@Injectable()
export class S3StorageService {
  async createPresignedPut(
    storageKey: string,
    contentType: string,
  ): Promise<{ uploadUrl: string; expiresIn: number }> {
    const cmd = new PutObjectCommand({
      Bucket: getBucket(),
      Key: storageKey,
      ContentType: contentType,
    });
    const uploadUrl = await getSignedUrl(getClient(), cmd, { expiresIn: PRESIGN_TTL_S });
    return { uploadUrl, expiresIn: PRESIGN_TTL_S };
  }
}
