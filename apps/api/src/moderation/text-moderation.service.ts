import { Injectable } from '@nestjs/common';
import type { TextModerationResult } from '@blesscupid/shared';
import { OpenAITextModerator } from './providers/openai-text.provider.js';

@Injectable()
export class TextModerationService {
  constructor(private readonly openai: OpenAITextModerator) {}

  async classify(text: string): Promise<TextModerationResult> {
    return this.openai.classify(text);
  }
}
