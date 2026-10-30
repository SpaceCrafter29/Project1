import { describe, expect, it } from 'vitest';
import { Coach, resolveStepId } from '../../server/coach';
import { SOLUTIONS } from '../../server/llm/mock/scripts/numberTheory';
import type { CompletionRequest, LLMProvider, Task } from '../../server/llm/types';

const models = { fast: 'fast', solver: 'solver', verifier: 'verifier' };

/** Answers by task; a function answer can look at the request. */
function byTask(answers: Partial<Record<Task, unknown | ((req: CompletionRequest, n: number) => unknown)>>) {
  const calls: CompletionRequest[] = [];
  const provider: LLMProvider = {
    name: 'mock',
    async complete(req) {
      calls.push(req);
      const a = answers[req.task];
      const n = calls.filter((c) => c.task === req.task).length;
      const value = typeof a === 'function' ? (a as (r: CompletionRequest, n: number) => unknown)(req, n) : a;
      if (value instanceof Error) throw value;
      return { text: JSON.stringify(value), usage: { promptTokens: 10, completionTokens: 5 } };
    },
  };
  return { provider, calls };
}

const steps = [
  { id: 's1', text: 'a = b' },
  { id: 's2', text: 'so every odd number is prime' },
  { id: 's3', text: 'done' },
];

describe('resolveStepId', () => {
  it('maps model references onto step ids', () => {
    expect(resolveStepId('s2', steps)).toBe('s2');
    expect(resolveStepId('[S2]', steps)).toBe('s2');
    expect(resolveStepId('2', steps)).toBe('s2');
    expect(resolveStepId('Step 3', steps)).toBe('s3');
    expect(resolveStepId('s9', steps)).toBeNull();
  });
});

describe('Coach.evaluate', () => {
  const firstPass = {
    steps: [
      { step: '1', status: 'Valid', reason: 'ok' },
      { step: 's2', status: 'error', quote: 'every odd number is prime', reason: 'false', evidence: '9 = 3*3', deduction: 3 },
    ],
    score: 4,
    summary: 'Mostly fine.',
  };

  it('runs an independent refutation for every critique, on the verifier model', async () => {
    const { provider, calls } = byTask({ evaluate: firstPass, refute: { upheld: true, reasoning: '9 is odd, not prime.' } });
    const coach = new Coach(provider, models);
    const result = await coach.evaluate({ problem: 'P', steps });

    expect(result.steps.map((s) => [s.step, s.status])).toEqual([
      ['s1', 'valid'],
      ['s2', 'error'],
      ['s3', 'unclear'], // not evaluated by the model -> never silently "valid"
    ]);
    expect(result.steps[0].refutation).toBeNull();
    expect(result.steps[1].refutation).toEqual({ upheld: true, reasoning: '9 is odd, not prime.' });
    const refute = calls.find((c) => c.task === 'refute')!;
    expect(refute.model).toBe('verifier');
    expect(JSON.stringify(refute.messages)).toContain('try hard to REFUTE');
    expect(coach.usage.snapshot()).toEqual({ calls: 2, promptTokens: 20, completionTokens: 10 });
  });

  it('keeps going when a refutation call fails (critique then becomes unclear in the UI)', async () => {
    const { provider } = byTask({ evaluate: firstPass, refute: new Error('boom') });
    const result = await new Coach(provider, models).evaluate({ problem: 'P', steps });
    expect(result.steps[1].refutation).toBeNull();
  });
});

describe('Coach.develop', () => {
  const verification = (overall: string) => ({ overall, steps: [], issues_summary: overall === 'flawed' ? 'a3 is wrong' : '' });

  it('returns directly when the independent review passes', async () => {
    const { provider, calls } = byTask({ solve: SOLUTIONS[0], verify: verification('valid') });
    const result = await new Coach(provider, models).develop({
      problem: 'P',
      idea: { one_liner: 'x', principle: 'y', principle_sentence: 'z' },
    });
    expect(result.repaired).toBe(false);
    expect(calls.map((c) => [c.task, c.model])).toEqual([
      ['solve', 'solver'],
      ['verify', 'verifier'],
    ]);
  });

  it('repairs once with the reviewer objections when the first draft is flawed', async () => {
    const { provider, calls } = byTask({
      solve: SOLUTIONS[0],
      verify: (_req: CompletionRequest, n: number) => verification(n === 1 ? 'flawed' : 'valid'),
    });
    const result = await new Coach(provider, models).develop({
      problem: 'P',
      idea: { one_liner: 'x', principle: 'y', principle_sentence: 'z' },
    });
    expect(result.repaired).toBe(true);
    expect(result.verification.overall).toBe('valid');
    expect(calls.map((c) => c.task)).toEqual(['solve', 'verify', 'solve', 'verify']);
    expect(JSON.stringify(calls[2].messages)).toContain('a3 is wrong');
  });
});

describe('Coach.correct', () => {
  it('maps fails_at onto confirmed step ids', async () => {
    const { provider } = byTask({
      correct: {
        approaches: [{ name: 'A', approach_works: 'Partly', works_why: 'w', fails_at: 'Step 2', fails_why: 'f', fix_hints: ['d1', 'd2'] }],
      },
    });
    const result = await new Coach(provider, models).correct({ problem: 'P', steps, verdicts: [] });
    expect(result.approaches[0]).toMatchObject({ approach_works: 'partly', fails_at: 's2' });
  });
});
