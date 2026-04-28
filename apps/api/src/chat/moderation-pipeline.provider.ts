import { Injectable } from '@nestjs/common';
import {
  ImageClassifier,
  ModerationPipeline,
  OpenAIModerationClient,
  TextClassifier,
  type ImageClassifierProvider,
  type ProviderLabel,
} from '@blesscupid/moderation';
import { RekognitionPhotoModerator } from '../moderation/providers/rekognition-photo.provider.js';
import { PrismaModerationStore } from './prisma-moderation-store.js';

/**
 * Wires the @blesscupid/moderation lib together with API-side providers.
 *
 * - Text: uses OpenAIModerationClient pointed at OPENAI_API_KEY, defaults to
 *   fail-closed (queue on provider error). Banned-phrase list is the lib
 *   default until the Pastor signs off (see BLE-9).
 * - Image: bridges the existing RekognitionPhotoModerator into the lib's
 *   ImageClassifierProvider interface so chat attachments share the same
 *   pipeline as profile photos.
 * - Store: PrismaModerationStore — Postgres rows backing the queue, reports,
 *   and blocks.
 */
@Injectable()
export class ChatModerationPipeline extends ModerationPipeline {
  constructor(rekognition: RekognitionPhotoModerator, store: PrismaModerationStore) {
    const openaiKey = process.env.OPENAI_API_KEY;
    const text = new TextClassifier({
      openai: new OpenAIModerationClient({ apiKey: openaiKey ?? 'missing' }),
      onProviderError: 'queue',
    });

    const provider: ImageClassifierProvider = {
      detectModerationLabels: async (input) => {
        const labels = await rekognition.detectUnsafeLabels(input.storageKey);
        return labels.map<ProviderLabel>((name) => ({ name, confidence: 95 }));
      },
      detectFace: async (input) => {
        const faces = await rekognition.detectFaces(input.storageKey);
        return faces.faces.length > 0;
      },
    };

    const image = new ImageClassifier({ provider, onProviderError: 'queue' });
    super({ text, image, store });
  }
}
