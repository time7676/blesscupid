import { Injectable } from '@nestjs/common';

/**
 * Rekognition-backed face detection + nudity/violence label detection.
 * TODO(BLE-7d): wire @aws-sdk/client-rekognition. Detect faces with bbox area ratio,
 *   confidence, and unsafe labels (Explicit Nudity, Suggestive, Violence).
 *
 * Until the AWS SDK is added, throw — calling endpoints will surface the unimplemented
 * error rather than silently allowing photos through.
 */
@Injectable()
export class RekognitionPhotoModerator {
  async detectFaces(_s3Key: string): Promise<{ faces: { confidence: number; areaRatio: number }[] }> {
    throw new Error('RekognitionPhotoModerator.detectFaces: not implemented (BLE-7d)');
  }

  async detectUnsafeLabels(_s3Key: string): Promise<string[]> {
    throw new Error('RekognitionPhotoModerator.detectUnsafeLabels: not implemented (BLE-7d)');
  }
}
