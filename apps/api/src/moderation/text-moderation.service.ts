import { Injectable } from '@nestjs/common';
import type { TextModerationResult } from '@blesscupid/shared';
import { GeminiTextModerator } from './providers/gemini-text.provider.js';
import { OpenAITextModerator } from './providers/openai-text.provider.js';

/**
 * Provider routing: Gemini is the default. OpenAI stays wired as a fallback
 * so we can flip back via env without redeploying. When neither key is set
 * the providers themselves fall open with `decision: 'review'`.
 */
@Injectable()
export class TextModerationService {
  constructor(
    private readonly gemini: GeminiTextModerator,
    private readonly openai: OpenAITextModerator,
  ) {}

  async classify(text: string): Promise<TextModerationResult> {
    const provider = process.env.TEXT_MODERATION_PROVIDER || 'gemini';
    if (provider === 'openai') return this.openai.classify(text);
    return this.gemini.classify(text);
  }
}
