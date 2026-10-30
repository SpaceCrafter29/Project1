import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../../server/app';
import { Coach } from '../../server/coach';
import { loadConfig } from '../../server/config';
import { MockProvider } from '../../server/llm/mock/mockProvider';
import { DEMO_PROBLEM, DEMO_STEPS } from '../../server/llm/mock/scripts/numberTheory';

let server: Server;
let url = '';

beforeAll(async () => {
  const app = createApp(new Coach(new MockProvider(0), { fast: 'f', solver: 's', verifier: 'v' }), {
    provider: 'mock',
    models: { fast: 'f', solver: 's', verifier: 'v' },
  });
  server = app.listen(0);
  url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api`;
});

afterAll(() => server.close());

const post = (path: string, body: unknown) =>
  fetch(`${url}/${path}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });

const steps = DEMO_STEPS.map((text, i) => ({ id: `s${i + 1}`, text }));

describe('API in demo mode', () => {
  it('reports the provider', async () => {
    expect(await (await fetch(`${url}/config`)).json()).toMatchObject({ provider: 'mock' });
  });

  it('validates requests', async () => {
    expect((await post('transcribe', { images: ['http://example.com/x.png'] })).status).toBe(400);
    expect((await post('hint', { problem: 'P', stage: 4 })).status).toBe(400);
    expect((await post('evaluate', { problem: '', steps })).status).toBe(400);
    expect((await post('nope', {})).status).toBe(404);
  });

  it('runs the evaluation pipeline with scripted critiques and refutations', async () => {
    const res = await post('evaluate', { problem: DEMO_PROBLEM, steps });
    const body = await res.json();
    expect(body.steps.map((s: { status: string }) => s.status)).toEqual(['valid', 'gap', 'error', 'valid', 'error', 'valid']);
    expect(body.steps[2].refutation.upheld).toBe(false);
    expect(body.steps[4].refutation.upheld).toBe(true);
    expect(body.score).toBe(3);
  });

  it('develops each demo alternative', async () => {
    const { ideas } = await (await post('propose', { problem: DEMO_PROBLEM, steps })).json();
    expect(ideas).toHaveLength(3);
    const developed = await Promise.all(ideas.map(async (idea: unknown) => (await post('develop', { problem: DEMO_PROBLEM, idea })).json()));
    expect(developed.map((d) => d.solution.final_answer_normalized)).toEqual(['n=3k', 'n=3k', 'n=6k']);
    expect(developed.every((d) => d.verification.overall === 'valid')).toBe(true);
  });

  it('discusses: concedes the disputed step', async () => {
    const res = await post('discuss', {
      problem: DEMO_PROBLEM,
      steps,
      stepId: 's3',
      critique: { status: 'error', reason: 'r', quote: 'exactly when', evidence: '' },
      history: [{ role: 'user', text: 'Step 2 covers both directions.' }],
    });
    expect(await res.json()).toMatchObject({ outcome: 'agree_valid' });
  });
});

describe('loadConfig', () => {
  it('falls back to demo mode without a key and defaults the models', () => {
    const c = loadConfig({});
    expect(c.provider).toBe('mock');
    expect(c.models).toEqual({ fast: 'muse-spark-1.3', solver: 'muse-spark-1.3', verifier: 'muse-spark-1.3' });
  });
  it('uses the strong model for verification when configured', () => {
    const c = loadConfig({ MODEL_API_KEY: 'k', MODEL_STRONG: 'muse-wonder-1.0' });
    expect(c.provider).toBe('meta');
    expect(c.models.verifier).toBe('muse-wonder-1.0');
    expect(c.models.solver).toBe('muse-spark-1.3');
  });
  it('rejects meta without a key', () => {
    expect(() => loadConfig({ MODEL_PROVIDER: 'meta' })).toThrow(/MODEL_API_KEY/);
  });
});

describe('geometry demo over the API', () => {
  it('serves an interactive figure for stage 3 and refutes the area formulas', async () => {
    const { GEOMETRY_PROBLEM, GEOMETRY_STEPS } = await import('../../server/llm/mock/scripts/geometry');
    const hint = await (await post('hint', { problem: GEOMETRY_PROBLEM, stage: 3 })).json();
    expect(hint).toMatchObject({ kind: 'figure', free_points: { A: [-6, -3] } });

    const steps = GEOMETRY_STEPS.map((text, i) => ({ id: `s${i + 1}`, text }));
    const evaluation = await (await post('evaluate', { problem: GEOMETRY_PROBLEM, steps })).json();
    expect(evaluation.steps.map((s: { status: string }) => s.status)).toEqual(['valid', 'valid', 'valid', 'gap', 'error', 'error']);
    expect(evaluation.steps[3].refutation.upheld).toBe(false);

    const vectors = await (await post('develop', { problem: GEOMETRY_PROBLEM, idea: (await (await post('propose', { problem: GEOMETRY_PROBLEM, steps })).json()).ideas[0] })).json();
    expect(vectors.solution.figure_code).toContain('geo.mid');
  });
});

describe('tip loop over the API', () => {
  const ask = async (body: object) => (await post('nexthint', { problem: DEMO_PROBLEM, previousProgress: [], note: '', history: [], ...body })).json();

  it('starts with one tip and gets more concrete while the student makes no progress', async () => {
    const { numberTheory } = await import('../../server/llm/mock/scripts/numberTheory');
    const opening = await ask({ progress: [] });
    expect(opening).toMatchObject({ status: 'not_started', level: 1, tool: 'small_cases' });

    const progress = numberTheory.progressSteps.map((text, i) => ({ id: `s${i + 1}`, text }));
    const first = await ask({ progress, history: [{ hint: opening.hint, level: 1 }] });
    expect(first).toMatchObject({ level: 1, status: 'on_track', focus_step: 's4' });
    expect(first.check_code).toBeTruthy();

    const history = [
      { hint: opening.hint, level: 1 },
      { hint: first.hint, level: 1 },
    ];
    const second = await ask({ progress, previousProgress: progress, history, note: 'still stuck' });
    expect(second).toMatchObject({ level: 2, status: 'stuck', check_code: null });
    const third = await ask({ progress, previousProgress: progress, history: [...history, { hint: second.hint, level: 2 }] });
    expect(third).toMatchObject({ level: 3, tool: 'skeleton' });
  });

  it('recognizes a complete attempt and points at a claim to double-check', async () => {
    const complete = await ask({ progress: steps, history: [{ hint: 'x', level: 1 }] });
    expect(complete).toMatchObject({ status: 'complete', focus_step: 's5' });
    expect(complete.check_claim).toBe('No odd number is divisible by 7');
  });

  it('reads unfinished work as progress', async () => {
    const pixel = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    const read = await (await post('recognize', { problem: DEMO_PROBLEM, images: [pixel], partial: true })).json();
    expect(read.steps.at(-1).text).toContain('Conjecture');
  });
});
