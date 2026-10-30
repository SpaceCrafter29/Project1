// Client for the Meta Model API (OpenAI-compatible /chat/completions).
import type { CompletionRequest, CompletionResult, LLMProvider } from './types';

export interface OpenAICompatibleOptions {
  baseUrl: string;
  apiKey: string;
  jsonMode: boolean;
  timeoutMs: number;
  /** Retries for 429/5xx/network errors. */
  retries?: number;
  fetchImpl?: typeof fetch;
}

export class ProviderError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'ProviderError';
  }
}

interface ChatCompletionBody {
  choices?: { message?: { content?: string | { type: string; text?: string }[] | null } }[];
  usage?: { prompt_tokens?: number; completion_tokens?: number };
  error?: { message?: string };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export class OpenAICompatibleProvider implements LLMProvider {
  readonly name = 'meta' as const;
  private readonly fetchImpl: typeof fetch;

  constructor(private readonly opts: OpenAICompatibleOptions) {
    this.fetchImpl = opts.fetchImpl ?? fetch;
  }

  async complete(req: CompletionRequest): Promise<CompletionResult> {
    const body: Record<string, unknown> = {
      model: req.model,
      messages: req.messages,
      temperature: req.temperature ?? 0.2,
    };
    if (this.opts.jsonMode) body.response_format = { type: 'json_object' };

    const retries = this.opts.retries ?? 2;
    let lastError: unknown;
    for (let attempt = 0; attempt <= retries; attempt++) {
      if (attempt > 0) await sleep(1000 * 2 ** (attempt - 1));
      let res: Response;
      try {
        res = await this.fetchImpl(`${this.opts.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.opts.apiKey}`,
          },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(this.opts.timeoutMs),
        });
      } catch (err) {
        lastError = new ProviderError(`Model API unreachable: ${(err as Error).message}`);
        continue;
      }
      const raw = await res.text();
      let json: ChatCompletionBody | undefined;
      try {
        json = JSON.parse(raw) as ChatCompletionBody;
      } catch {
        json = undefined;
      }
      if (!res.ok) {
        const msg = json?.error?.message ?? raw.slice(0, 300);
        lastError = new ProviderError(`Model API error ${res.status}: ${msg}`, res.status);
        if (res.status === 429 || res.status >= 500) continue;
        throw lastError;
      }
      const content = json?.choices?.[0]?.message?.content;
      const text = Array.isArray(content)
        ? content.map((p) => p.text ?? '').join('')
        : (content ?? '');
      if (!text) throw new ProviderError('Model API returned an empty answer');
      return {
        text,
        usage: json?.usage
          ? { promptTokens: json.usage.prompt_tokens ?? 0, completionTokens: json.usage.completion_tokens ?? 0 }
          : undefined,
      };
    }
    throw lastError;
  }
}
