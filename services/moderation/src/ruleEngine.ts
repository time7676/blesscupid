/**
 * Rule-based text moderation engine. Zero external calls.
 *
 * Pass 1: banned phrases (hard block, soft flag).
 * Pass 2: regex pattern scoring per category.
 *
 * Scores 0..1. Thresholds in textClassifier.ts.
 */

export interface CategoryScores {
  sexual: number;
  sexual_minors: number;
  harassment_severe: number;
  hate: number;
  self_harm: number;
  violence_graphic: number;
  [key: string]: number;
}

interface Rule {
  pattern: RegExp;
  category: keyof CategoryScores;
  score: number;
}

const RULES: readonly Rule[] = [
  // Sexual content
  { pattern: /\b(send nude|nudes?|naked pic|naked photo|naked selfie)\b/gi, category: "sexual", score: 0.95 },
  { pattern: /\b(show me your|show ur) (body|boobs|butt|ass|pussy|dick|cock)\b/gi, category: "sexual", score: 0.95 },
  { pattern: /\b(horny|wet|hard for you|turn me on|turn on|sexting|sext)\b/gi, category: "sexual", score: 0.85 },
  { pattern: /\b(fuck|fck|fk)\b/gi, category: "sexual", score: 0.6 },
  { pattern: /\b(hookup|hook up|dtf|down to fuck|netflix and chill)\b/gi, category: "sexual", score: 0.85 },
  { pattern: /\b(come over tonight|your place or mine|alone at home)\b/gi, category: "sexual", score: 0.7 },
  // Minors protection
  { pattern: /\b(underage|i am (12|13|14|15|16|17)|middle school|high school freshman)\b/gi, category: "sexual_minors", score: 0.9 },
  { pattern: /\b(im 1[0-7] years? old)\b/gi, category: "sexual_minors", score: 0.95 },
  { pattern: /\b(older men|sugar daddy|daddy issues)\b/gi, category: "sexual_minors", score: 0.6 },
  // Harassment / threats
  { pattern: /\b(kill yourself|kys|die in a fire|hope you die|i will find you)\b/gi, category: "harassment_severe", score: 0.95 },
  { pattern: /\b(stupid bitch|ugly|fat|worthless|loser|kill yourself)\b/gi, category: "harassment_severe", score: 0.7 },
  // Hate
  { pattern: /\b(racial slur|n-word|f-word slur)\b/gi, category: "hate", score: 0.95 },
  { pattern: /\b(christian fundamentalist|bible thumper|religious nut|god hates)\b/gi, category: "hate", score: 0.75 },
  // Self-harm
  { pattern: /\b(cut myself|self.?harm|suicidal|ending it all|no point living)\b/gi, category: "self_harm", score: 0.9 },
  // Violence
  { pattern: /\b(gonna beat|will hurt|stab|shoot|gun|weapon|attack)\b/gi, category: "violence_graphic", score: 0.8 },
];

export function scoreText(text: string): CategoryScores {
  const scores: CategoryScores = {
    sexual: 0,
    sexual_minors: 0,
    harassment_severe: 0,
    hate: 0,
    self_harm: 0,
    violence_graphic: 0,
  };

  for (const rule of RULES) {
    const matches = text.match(rule.pattern);
    if (matches && matches.length > 0) {
      const base = rule.score;
      const repeated = Math.min(matches.length * 0.15, 0.3);
      const current = scores[rule.category] ?? 0;
      scores[rule.category] = Math.min(1, Math.max(current, base + repeated));
    }
  }

  return scores;
}
