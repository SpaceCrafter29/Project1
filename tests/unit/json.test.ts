import { describe, expect, it } from 'vitest';
import { RefutationSchema } from '../../shared/schemas';
import { ModelOutputError, callJson, extractJson, repairLatexEscapes } from '../../server/llm/json';
import type { CompletionRequest, LLMProvider } from '../../server/llm/types';

describe('extractJson', () => {
  it('parses plain JSON, fenced JSON and JSON surrounded by chatter', () => {
    expect(extractJson('{"a":1}')).toEqual({ a: 1 });
    expect(extractJson('```json\n{"a":2}\n```')).toEqual({ a: 2 });
    expect(extractJson('Sure! Here it is: {"a": "x}y", "b": [1, {"c": 3}]} Hope this helps.')).toEqual({
      a: 'x}y',
      b: [1, { c: 3 }],
    });
    expect(extractJson('{"tex": "$\\\\frac{1}{2}$"}')).toEqual({ tex: '$\\frac{1}{2}$' });
  });
  it('repairs LaTeX written with single backslashes', () => {
    // As a model would emit it: invalid escapes (\p, \m) and LaTeX that collides with JSON escapes (\f, \n, \t).
    const raw = String.raw`{"a": "$\frac{1}{2} \pmod 7$, $7 \mid n$, $a \neq b$, $\text{odd}$ and $\times$\nNext line\tTab"}`;
    expect(extractJson(raw)).toEqual({ a: '$\\frac{1}{2} \\pmod 7$, $7 \\mid n$, $a \\neq b$, $\\text{odd}$ and $\\times$\nNext line\tTab' });
  });

  it('leaves correctly escaped JSON alone', () => {
    const ok = JSON.stringify({ a: '$\\frac{1}{2}$\nline', b: 'quote " and \\u0041', c: '\u00e9' });
    expect(repairLatexEscapes(ok)).toBe(ok);
    expect(extractJson(ok)).toEqual(JSON.parse(ok));
  });

  it('skips braces in chatter before the JSON', () => {
    expect(extractJson('The set $\\{1, 2\\}$ matters. {"a": 1}')).toEqual({ a: 1 });
  });

  it('throws when there is no JSON', () => {
    expect(() => extractJson('no json here')).toThrow();
    expect(() => extractJson('{"a": 1')).toThrow();
  });
});

function scripted(answers: string[]): LLMProvider & { requests: CompletionRequest[] } {
  const requests: CompletionRequest[] = [];
  return {
    name: 'mock',
    requests,
    async complete(req) {
      requests.push(req);
      return { text: answers.shift() ?? '' };
    },
  };
}

const req: CompletionRequest = { task: 'refute', model: 'm', messages: [{ role: 'user', content: 'x' }] };

describe('callJson', () => {
  it('normalizes loosely formatted enums and validates', async () => {
    const provider = scripted(['{"upheld": true, "reasoning": "  fine  "}']);
    expect(await callJson(provider, req, RefutationSchema)).toEqual({ upheld: true, reasoning: 'fine' });
  });

  it('asks once for a corrected answer and includes the problem', async () => {
    const provider = scripted(['not json at all', '{"upheld": false, "reasoning": "ok"}']);
    expect(await callJson(provider, req, RefutationSchema)).toEqual({ upheld: false, reasoning: 'ok' });
    const repair = provider.requests[1].messages;
    expect(repair).toHaveLength(3);
    expect(repair[1]).toEqual({ role: 'assistant', content: 'not json at all' });
    expect(String(repair[2].content)).toContain('not valid JSON');
  });

  it('gives up after the repair round', async () => {
    const provider = scripted(['{"upheld": "maybe"}', '{"reasoning": 1}']);
    await expect(callJson(provider, req, RefutationSchema)).rejects.toBeInstanceOf(ModelOutputError);
    expect(provider.requests).toHaveLength(2);
  });
});
