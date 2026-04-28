/**
 * OpenAI Moderation API client. Keeps the wire format isolated so the rest of
 * the pipeline doesn't depend on OpenAI's response shape.
 *
 * Uses fetch (Node 20+, Bun, Edge runtimes). No SDK dep needed.
 */

export interface OpenAIModerationConfig {
  apiKey: string;
  /** Override for tests / proxying. */
  baseUrl?: string;
  /** Default 'omni-moderation-latest' (see ADR-0001). */
  model?: string;
  /** ms — fail closed on timeout (treat as queue, not allow). */
  timeoutMs?: number;
  /** Override fetch impl for tests. */
  fetchImpl?: typeof fetch;
}

export interface OpenAIModerationCategoryScores {
  sexual: number;
  "sexual/minors": number;
  harassment: number;
  "harassment/threatening": number;
  hate: number;
  "hate/threatening": number;
  "self-harm": number;
  "self-harm/intent": number;
  "self-harm/instructions": number;
  violence: number;
  "violence/graphic": number;
  illicit?: number;
  "illicit/violent"?: number;
}

export interface OpenAIModerationResultRaw {
  flagged: boolean;
  categories: Record<string, boolean>;
  category_scores: OpenAIModerationCategoryScores & Record<string, number>;
}

export interface OpenAIModerationApiResponse {
  id: string;
  model: string;
  results: OpenAIModerationResultRaw[];
}

export class OpenAIModerationClient {
  constructor(private readonly config: OpenAIModerationConfig) {
    if (!config.apiKey) {
      throw new Error("OpenAIModerationClient requires apiKey");
    }
  }

  async moderate(text: string): Promise<OpenAIModerationResultRaw> {
    const url = `${this.config.baseUrl ?? "https://api.openai.com"}/v1/moderations`;
    const model = this.config.model ?? "omni-moderation-latest";
    const fetchImpl = this.config.fetchImpl ?? fetch;
    const timeoutMs = this.config.timeoutMs ?? 4000;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetchImpl(url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({ model, input: text }),
        signal: controller.signal,
      });
      if (!res.ok) {
        throw new OpenAIModerationError(
          `openai_moderation_http_${res.status}`,
          res.status,
        );
      }
      const json = (await res.json()) as OpenAIModerationApiResponse;
      const first = json.results[0];
      if (!first) {
        throw new OpenAIModerationError("openai_moderation_empty_results", 502);
      }
      return first;
    } catch (err) {
      if (err instanceof OpenAIModerationError) throw err;
      const isAbort = (err as Error).name === "AbortError";
      throw new OpenAIModerationError(
        isAbort ? "openai_moderation_timeout" : "openai_moderation_network",
        isAbort ? 504 : 503,
        err as Error,
      );
    } finally {
      clearTimeout(timer);
    }
  }
}

export class OpenAIModerationError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public override readonly cause?: Error,
  ) {
    super(message);
    this.name = "OpenAIModerationError";
  }
}
