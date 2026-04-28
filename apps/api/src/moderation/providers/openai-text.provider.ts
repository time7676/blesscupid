import { Injectable } from '@nestjs/common';
import type { TextModerationResult } from '@blesscupid/shared';

const PROVIDER = 'openai:omni-moderation-latest';

const BLOCK_CATEGORIES = new Set([
  'sexual',
  'sexual/minors',
  'violence/graphic',
  'self-harm/instructions',
]);
const REVIEW_CATEGORIES = new Set([
  'harassment',
  'hate',
  'self-harm',
  'violence',
]);

@Injectable()
export class OpenAITextModerator {
  async classify(text: string): Promise<TextModerationResult> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      // Conservative default when unset: review.
      return { decision: 'review', categories: ['provider_unavailable'], rawScore: 0, provider: PROVIDER };
    }

    const res = await fetch('https://api.openai.com/v1/moderations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model: 'omni-moderation-latest', input: text }),
    });
    if (!res.ok) {
      return { decision: 'review', categories: ['provider_error'], rawScore: 0, provider: PROVIDER };
    }
    const json = (await res.json()) as {
      results: { flagged: boolean; categories: Record<string, boolean>; category_scores: Record<string, number> }[];
    };
    const result = json.results[0];
    if (!result) {
      return { decision: 'review', categories: ['provider_empty'], rawScore: 0, provider: PROVIDER };
    }

    const flagged = Object.entries(result.categories)
      .filter(([, v]) => v)
      .map(([k]) => k);

    let decision: TextModerationResult['decision'] = 'allow';
    if (flagged.some((c) => BLOCK_CATEGORIES.has(c))) decision = 'block';
    else if (flagged.some((c) => REVIEW_CATEGORIES.has(c))) decision = 'review';

    const rawScore = Math.max(0, ...Object.values(result.category_scores));
    return { decision, categories: flagged, rawScore, provider: PROVIDER };
  }
}
