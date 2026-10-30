// Exercises the real Meta API code path (OpenAI-compatible HTTP) against a local
// fake server, since no API key is available yet.
import { createServer, type IncomingMessage, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../../server/app';
import { Coach } from '../../server/coach';
import { loadConfig } from '../../server/config';
import { OpenAICompatibleProvider, ProviderError } from '../../server/llm/openaiCompatible';

interface Recorded {
  headers: IncomingMessage['headers'];
  body: { model: string; messages: { role: string; content: unknown }[]; response_format?: unknown; temperature?: number };
}

const PIXEL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

let fake: Server;
let baseUrl = '';
const recorded: Recorded[] = [];
let script: ((body: Recorded['body']) => { status?: number; json: unknown })[] = [];

function reply(content: string, usage = { prompt_tokens: 100, completion_tokens: 20 }) {
  return { json: { choices: [{ message: { role: 'assistant', content } }], usage } };
}

beforeAll(async () => {
  fake = createServer((req, res) => {
    let raw = '';
    req.on('data', (c) => (raw += c));
    req.on('end', () => {
      const body = JSON.parse(raw) as Recorded['body'];
      recorded.push({ headers: req.headers, body });
      const next = script.shift() ?? (() => ({ status: 500, json: { error: { message: 'no script' } } }));
      const { status = 200, json } = next(body);
      res.writeHead(status, { 'content-type': 'application/json' });
      res.end(JSON.stringify(json));
    });
  });
  await new Promise<void>((r) => fake.listen(0, r));
  baseUrl = `http://127.0.0.1:${(fake.address() as AddressInfo).port}/v1`;
});

afterAll(() => {
  fake.close();
});

const provider = (retries = 0) =>
  new OpenAICompatibleProvider({ baseUrl, apiKey: 'test-key', jsonMode: true, timeoutMs: 5000, retries });

describe('OpenAICompatibleProvider', () => {
  it('sends an OpenAI-compatible request with images, JSON mode and the bearer key', async () => {
    recorded.length = 0;
    script = [() => reply('{"ok": true}')];
    const result = await provider().complete({
      task: 'transcribe',
      model: 'muse-spark-1.3',
      messages: [
        { role: 'system', content: 'sys' },
        { role: 'user', content: [{ type: 'text', text: 'read' }, { type: 'image_url', image_url: { url: PIXEL } }] },
      ],
    });
    expect(result).toEqual({ text: '{"ok": true}', usage: { promptTokens: 100, completionTokens: 20 } });
    const { headers, body } = recorded[0];
    expect(headers.authorization).toBe('Bearer test-key');
    expect(body.model).toBe('muse-spark-1.3');
    expect(body.response_format).toEqual({ type: 'json_object' });
    expect(body.messages[1].content).toEqual([
      { type: 'text', text: 'read' },
      { type: 'image_url', image_url: { url: PIXEL } },
    ]);
  });

  it('retries rate limits and server errors, but not client errors', async () => {
    script = [() => ({ status: 429, json: { error: { message: 'slow down' } } }), () => reply('{"ok": 1}')];
    await expect(provider(1).complete({ task: 'ask', model: 'm', messages: [] })).resolves.toMatchObject({ text: '{"ok": 1}' });

    script = [() => ({ status: 400, json: { error: { message: 'bad model' } } })];
    await expect(provider(2).complete({ task: 'ask', model: 'm', messages: [] })).rejects.toThrow(/400: bad model/);
  });

  it('accepts content given as an array of parts', async () => {
    script = [() => ({ json: { choices: [{ message: { content: [{ type: 'text', text: '{"a":' }, { type: 'text', text: '1}' }] } }] } })];
    await expect(provider().complete({ task: 'ask', model: 'm', messages: [] })).resolves.toMatchObject({ text: '{"a":1}' });
  });

  it('reports an unreachable API', async () => {
    const p = new OpenAICompatibleProvider({ baseUrl: 'http://127.0.0.1:9/v1', apiKey: 'k', jsonMode: false, timeoutMs: 2000, retries: 0 });
    await expect(p.complete({ task: 'ask', model: 'm', messages: [] })).rejects.toBeInstanceOf(ProviderError);
  });
});

describe('server + Meta provider, end to end over HTTP', () => {
  it('runs transcription, evaluation with refutation, and surfaces format errors', async () => {
    const config = loadConfig({ MODEL_API_KEY: 'k', MODEL_BASE_URL: baseUrl, MODEL_FAST: 'spark', MODEL_STRONG: 'wonder' });
    expect(config.provider).toBe('meta');
    const coach = new Coach(provider(), config.models);
    const app = createApp(coach, { provider: 'meta', models: config.models });
    const server = app.listen(0);
    const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api`;
    const post = (path: string, body: unknown) =>
      fetch(`${url}/${path}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });

    try {
      recorded.length = 0;
      // The model wraps its JSON in a fence – the server must still accept it.
      script = [() => reply('```json\n{"text": "Find all $n$.", "topic": "Number Theory", "uncertain": []}\n```')];
      const t = await post('transcribe', { images: [PIXEL] });
      expect(t.status).toBe(200);
      expect(await t.json()).toEqual({ text: 'Find all $n$.', topic: 'Number Theory', uncertain: [] });
      expect(recorded[0].body.model).toBe('spark');

      recorded.length = 0;
      script = [
        () =>
          reply(
            JSON.stringify({
              steps: [
                { step: 's1', status: 'valid', reason: 'ok' },
                { step: 's2', status: 'error', quote: 'n is odd', reason: 'wrong', evidence: 'n = 2', deduction: 2 },
              ],
              score: 5,
              summary: 'Good start.',
            }),
          ),
        () => reply('{"upheld": false, "reasoning": "n odd follows from s1."}'),
      ];
      const e = await post('evaluate', { problem: 'Find all $n$.', steps: [{ id: 's1', text: 'n^2 odd' }, { id: 's2', text: 'so n is odd' }] });
      expect(e.status).toBe(200);
      const evaluation = await e.json();
      expect(evaluation.steps[1].refutation).toEqual({ upheld: false, reasoning: 'n odd follows from s1.' });
      expect(recorded.map((r) => r.body.model)).toEqual(['spark', 'wonder']);

      script = [() => reply('I cannot answer in JSON.'), () => reply('Still no JSON.')];
      const bad = await post('hint', { problem: 'P', stage: 1 });
      expect(bad.status).toBe(502);
      expect((await bad.json()).error).toMatch(/unexpected format/);

      const usage = await (await fetch(`${url}/usage`)).json();
      expect(usage.calls).toBe(5);
      expect(usage.promptTokens).toBe(500);
    } finally {
      server.close();
    }
  });
});
