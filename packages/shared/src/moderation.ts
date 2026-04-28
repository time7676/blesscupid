export type TextModerationDecision = 'allow' | 'review' | 'block';

export interface TextModerationResult {
  decision: TextModerationDecision;
  categories: string[];
  rawScore: number;
  provider: string;
}

export interface FaceDetectionResult {
  faceCount: number;
  largestFaceAreaRatio: number;
  hasFace: boolean;
  passes: boolean;
  reasons: FaceRejectionReason[];
}

export type FaceRejectionReason =
  | 'no_face_detected'
  | 'face_too_small'
  | 'multiple_faces'
  | 'low_confidence';

export const FACE_AREA_MIN_RATIO = 0.08;
export const FACE_CONFIDENCE_MIN = 0.9;

export interface PhotoModerationResult {
  face: FaceDetectionResult;
  unsafeLabels: string[];
  decision: 'allow' | 'review' | 'block';
}
