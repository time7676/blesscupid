import { Injectable } from '@nestjs/common';
import {
  FACE_AREA_MIN_RATIO,
  FACE_CONFIDENCE_MIN,
  type FaceDetectionResult,
  type FaceRejectionReason,
  type PhotoModerationResult,
} from '@blesscupid/shared';
import { RekognitionPhotoModerator } from './providers/rekognition-photo.provider.js';

@Injectable()
export class PhotoModerationService {
  constructor(private readonly rekognition: RekognitionPhotoModerator) {}

  async moderate(s3Key: string): Promise<PhotoModerationResult> {
    const [faceRaw, unsafeLabels] = await Promise.all([
      this.rekognition.detectFaces(s3Key),
      this.rekognition.detectUnsafeLabels(s3Key),
    ]);

    const face = this.evaluateFace(faceRaw);
    const decision = unsafeLabels.length > 0 ? 'block' : face.passes ? 'allow' : 'review';
    return { face, unsafeLabels, decision };
  }

  private evaluateFace(raw: { faces: { confidence: number; areaRatio: number }[] }): FaceDetectionResult {
    const faces = raw.faces;
    const reasons: FaceRejectionReason[] = [];

    if (faces.length === 0) reasons.push('no_face_detected');
    if (faces.length > 1) reasons.push('multiple_faces');

    const lowConfidence = faces.some((f) => f.confidence < FACE_CONFIDENCE_MIN);
    if (lowConfidence) reasons.push('low_confidence');

    const largest = faces.reduce((m, f) => Math.max(m, f.areaRatio), 0);
    if (faces.length > 0 && largest < FACE_AREA_MIN_RATIO) reasons.push('face_too_small');

    return {
      faceCount: faces.length,
      largestFaceAreaRatio: largest,
      hasFace: faces.length > 0,
      passes: reasons.length === 0,
      reasons,
    };
  }
}
