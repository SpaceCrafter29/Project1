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

// LaTeX commands that start with a valid JSON escape letter (\b \f \n \r \t). Models often
// forget to double the backslash, which would silently turn "\frac" into a form feed + "rac".
const LATEX_AFTER_ESCAPE =
  /^(?:b(?:eta|inom|mod|ar|ig|igl|igr|igg|oxed|ullet|ot|egin|ackslash)|f(?:rac|orall|lat|rak|rown)|n(?:eq|abla|ot|otin|u|mid|e|ewline|exists|i|eg|leq|geq|parallel|subseteq)|r(?:ight|angle|ho|floor|ceil|brace|vert|Vert)|t(?:imes|ext|extbf|extit|au|heta|o|frac|ilde|riangle|op|imes))(?![a-zA-Z])/;

/**
 * Doubles backslashes inside JSON strings that are not valid escapes, or that are
 * the start of a LaTeX command (e.g. \frac, \neq). Leaves everything else unchanged.
 */
export function repairLatexEscapes(raw: string): string {
  let out = '';
  let inString = false;
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (!inString) {
      if (ch === '"') inString = true;
      out += ch;
      continue;
    }
    if (ch === '"') {
      inString = false;
      out += ch;
      continue;
    }
    if (ch !== '\\') {
      out += ch;
      continue;
    }
    const next = raw[i + 1] ?? '';
    if (next === '\\' || next === '"' || next === '/') {
      out += ch + next;
      i++;
    } else if (next === 'u' && /^[0-9a-fA-F]{4}$/.test(raw.slice(i + 2, i + 6))) {
      out += ch;
    } else if ('bfnrt'.includes(next) && next !== '' && !LATEX_AFTER_ESCAPE.test(raw.slice(i + 1))) {
      out += ch;
    } else {
      out += '\\\\';
    }
  }
  return out;
}

function parse(text: string): unknown {
  try {
    return JSON.parse(repairLatexEscapes(text));
  } catch {
    return JSON.parse(text);
  }
}

/** Balanced {...} or [...] starting at `start`, or null. */
function balanced(text: string, start: number): string | null {
  const open = text[start];
  const close = open === '{' ? '}' : ']';
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === open) depth++;
    else if (ch === close && --depth === 0) return text.slice(start, i + 1);
  }
  return null;
}

/** Finds the first complete JSON object/array in a text (handles ```json fences, chatter and unescaped LaTeX). */
export function extractJson(text: string): unknown {
  const trimmed = text.trim();
  try {
    return parse(trimmed);
  } catch {
    // fall through
  }
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) {
    try {
      return parse(fenced[1]);
    } catch {
      // fall through
    }
  }
  let attempts = 0;
  for (let i = 0; i < trimmed.length && attempts < 20; i++) {
    if (trimmed[i] !== '{' && trimmed[i] !== '[') continue;
    attempts++;
    const candidate = balanced(trimmed, i);
    if (!candidate) continue;
    try {
      return parse(candidate);
    } catch {
      // try the next opening bracket
    }
  }
  throw new Error('no JSON found');
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
