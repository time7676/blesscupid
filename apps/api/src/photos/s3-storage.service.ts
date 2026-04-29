import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand, type S3ClientConfig } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const PRESIGN_TTL_S = 300;

let cachedClient: S3Client | null = null;

/**
 * Build an S3-compatible client. When `S3_ENDPOINT` is set we treat it as a
 * custom endpoint (Cloudflare R2, MinIO, etc.). Region defaults to `auto` for
 * R2; AWS deployments still use the AWS_REGION value.
 */
function getClient(): S3Client {
  if (cachedClient) return cachedClient;
  const endpoint = process.env.S3_ENDPOINT;
  const region = process.env.AWS_REGION || (endpoint ? 'auto' : undefined);
  if (!region) throw new Error('AWS_REGION (or S3_ENDPOINT) not set');

  const cfg: S3ClientConfig = { region };
  if (endpoint) {
    cfg.endpoint = endpoint;
    // R2 + most S3-compat backends require path-style addressing.
    cfg.forcePathStyle = true;
  }
  const accessKeyId = process.env.S3_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey =
    process.env.S3_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;
  if (accessKeyId && secretAccessKey) {
    cfg.credentials = { accessKeyId, secretAccessKey };
  }
  cachedClient = new S3Client(cfg);
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
