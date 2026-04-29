import { Injectable } from '@nestjs/common';
import type { TextModerationResult } from '@blesscupid/shared';

/**
 * Gemini-backed text moderator. Uses gemini-2.5-flash-lite (cheapest tier
 * with structured output support) via the Google Generative Language REST
 * API. No SDK — single fetch keeps cold-start cost low and avoids
 * versioning churn.
 *
 * Cost note: flash-lite ≈ $0.10 / 1M input + $0.40 / 1M output tokens (as
 * of 2026-04). A 200-char DM costs ~50 input tokens + ~30 output tokens,
 * so ≈ $0.000005 / message. Free tier (60 RPM) covers any v1 chat volume.
 *
 * Falls open with `decision: 'review'` whenever the call fails — never
 * silently allows on provider error. Holy Code §HCoC requires defensive
 * default.
 */

const PROVIDER = 'gemini:gemini-2.5-flash-lite';
const MODEL = 'gemini-2.5-flash-lite';
const ENDPOINT_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

type GeminiCategory =
  | 'sexual'
  | 'sexual_minors'
  | 'harassment'
  | 'harassment_severe'
  | 'hate'
  | 'self_harm'
  | 'violence'
  | 'violence_graphic';

interface ClassifierJson {
  block: boolean;
  review: boolean;
  categories: GeminiCategory[];
  confidence: number;
  reason?: string;
}

const SYSTEM_PROMPT = `You moderate Indonesian + English chat messages for BlessCupid, a Christian dating + friendship app. Indonesian Christians (Catholic/Protestant) are the audience. Holy Code of Conduct: no sexual content, no slurs, no self-harm encouragement, no violence threats.

Classify the message into JSON with this exact shape:
{
  "block": boolean,
  "review": boolean,
  "categories": string[],
  "confidence": number,
  "reason": string
}

Set "block": true ONLY for these categories: sexual, sexual_minors, violence_graphic, self_harm with explicit instruction.
Set "review": true (with block=false) for borderline harassment, hate speech, doctrinal arguments crossing into mockery, or self-harm ideation without instruction.
Categories pick from: sexual, sexual_minors, harassment, harassment_severe, hate, self_harm, violence, violence_graphic.
Confidence: 0.0 (very unsure) to 1.0 (certain).
Reason: one short sentence in English.

Be lenient on faith vocabulary, prayer language, dating compliments, family talk. Be strict on sexual innuendo, threats, slurs.
Reply with ONLY the JSON object, no markdown fence, no commentary.`;

const BLOCK_CATEGORIES = new Set<GeminiCategory>([
  'sexual',
  'sexual_minors',
  'violence_graphic',
]);
const REVIEW_CATEGORIES = new Set<GeminiCategory>([
  'harassment',
  'harassment_severe',
  'hate',
  'self_harm',
  'violence',
]);

@Injectable()
export class GeminiTextModerator {
  async classify(text: string): Promise<TextModerationResult> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return {
        decision: 'review',
        categories: ['provider_unavailable'],
        rawScore: 0,
        provider: PROVIDER,
      };
    }

    const url = `${ENDPOINT_BASE}/${MODEL}:generateContent?key=${apiKey}`;
    let res: Response;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ role: 'user', parts: [{ text }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0,
            maxOutputTokens: 200,
          },
        }),
      });
    } catch {
      return {
        decision: 'review',
        categories: ['provider_error'],
        rawScore: 0,
        provider: PROVIDER,
      };
    }

    if (!res.ok) {
      return {
        decision: 'review',
        categories: ['provider_error'],
        rawScore: 0,
        provider: PROVIDER,
      };
    }

    const json = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const raw = json.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!raw) {
      return {
        decision: 'review',
        categories: ['provider_empty'],
        rawScore: 0,
        provider: PROVIDER,
      };
    }

    let parsed: ClassifierJson;
    try {
      parsed = JSON.parse(raw) as ClassifierJson;
    } catch {
      return {
        decision: 'review',
        categories: ['provider_parse_error'],
        rawScore: 0,
        provider: PROVIDER,
      };
    }

    const cats = (parsed.categories ?? []).filter(Boolean);
    let decision: TextModerationResult['decision'] = 'allow';
    if (parsed.block || cats.some((c) => BLOCK_CATEGORIES.has(c))) {
      decision = 'block';
    } else if (parsed.review || cats.some((c) => REVIEW_CATEGORIES.has(c))) {
      decision = 'review';
    }

    return {
      decision,
      categories: cats,
      rawScore: typeof parsed.confidence === 'number' ? parsed.confidence : 0,
      provider: PROVIDER,
    };
  }
}
