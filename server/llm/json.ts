// Getting validated JSON out of a model: tolerant extraction plus one repair round.
import type { z } from 'zod';
import type { CompletionRequest, LLMProvider } from './types';

export class ModelOutputError extends Error {
  constructor(
    message: string,
    readonly raw: string,
  ) {
    super(message);
    this.name = 'ModelOutputError';
  }
}

/** Finds the first complete JSON object/array in a text (handles ```json fences and chatter). */
export function extractJson(text: string): unknown {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    // fall through
  }
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) {
    try {
      return JSON.parse(fenced[1]);
    } catch {
      // fall through
    }
  }
  const start = trimmed.search(/[[{]/);
  if (start < 0) throw new Error('no JSON found');
  const open = trimmed[start];
  const close = open === '{' ? '}' : ']';
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < trimmed.length; i++) {
    const ch = trimmed[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === open) depth++;
    else if (ch === close && --depth === 0) {
      return JSON.parse(trimmed.slice(start, i + 1));
    }
  }
  throw new Error('unterminated JSON');
}

export interface UsageSink {
  record(usage: { promptTokens: number; completionTokens: number } | undefined): void;
}

/** Calls the model and validates the answer; asks once for a corrected answer if needed. */
export async function callJson<S extends z.ZodType>(
  provider: LLMProvider,
  req: CompletionRequest,
  schema: S,
  usage?: UsageSink,
): Promise<z.output<S>> {
  let messages = req.messages;
  let lastRaw = '';
  let lastProblem = '';
  for (let round = 0; round < 2; round++) {
    const result = await provider.complete({ ...req, messages });
    usage?.record(result.usage);
    lastRaw = result.text;
    let parsed: unknown;
    try {
      parsed = extractJson(result.text);
    } catch (err) {
      lastProblem = `not valid JSON (${(err as Error).message})`;
      messages = repair(req.messages, result.text, lastProblem);
      continue;
    }
    const checked = schema.safeParse(parsed);
    if (checked.success) return checked.data;
    lastProblem = checked.error.issues
      .slice(0, 5)
      .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('; ');
    messages = repair(req.messages, result.text, lastProblem);
  }
  throw new ModelOutputError(`The model answer for "${req.task}" did not match the format: ${lastProblem}`, lastRaw);
}

function repair(original: CompletionRequest['messages'], answer: string, problem: string) {
  return [
    ...original,
    { role: 'assistant' as const, content: answer },
    {
      role: 'user' as const,
      content: `Your answer was ${problem.startsWith('not valid') ? problem : `invalid: ${problem}`}. Reply again with only the corrected JSON object in the required format.`,
    },
  ];
}
