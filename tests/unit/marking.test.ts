import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { FirstPassStepSchema, RecognitionSchema } from '../../shared/schemas';
import { MockProvider } from '../../server/llm/mock/mockProvider';
import { DEMO_PROBLEM } from '../../server/llm/mock/scripts/numberTheory';

const sample = (file: string) =>
  `data:image/png;base64,${readFileSync(path.resolve('public/samples', file)).toString('base64')}`;

describe('step boxes on the photo', () => {
  it('accepts boxes in fractions and drops unusable ones instead of failing the recognition', () => {
    const parsed = RecognitionSchema.parse({
      steps: [
        { text: 'a', unclear: false, box: { page: 0, x: 0.1, y: 0.2, w: 0.5, h: 0.1 } },
        { text: 'b', unclear: false, box: { x: 120, y: 40, w: 300, h: 20 } },
        { text: 'c', unclear: false },
      ],
      unreadable: [],
    });
    expect(parsed.steps.map((s) => s.box)).toEqual([{ page: 0, x: 0.1, y: 0.2, w: 0.5, h: 0.1 }, null, null]);
  });

  it('demo mode marks the sample photo, one box per step, and nothing on other photos', async () => {
    const provider = new MockProvider(0);
    const recognize = async (images: string[]) =>
      JSON.parse((await provider.complete({ task: 'recognize', model: 'm', messages: [], input: { problem: DEMO_PROBLEM, images } })).text);

    const marked = await recognize([sample('solution.png')]);
    expect(marked.steps).toHaveLength(6);
    for (const { box } of marked.steps) {
      expect(box.page).toBe(0);
      expect(box.x + box.w).toBeLessThanOrEqual(1);
      expect(box.y + box.h).toBeLessThanOrEqual(1);
    }
    // Steps are written top to bottom.
    const tops = marked.steps.map((s: { box: { y: number } }) => s.box.y);
    expect([...tops].sort((a, b) => a - b)).toEqual(tops);

    const other = await recognize([sample('problem.png')]);
    expect(other.steps.every((s: { box: unknown }) => s.box === null)).toBe(true);
  });
});

describe('wording notes', () => {
  it('default to none, so older or terse answers still parse', () => {
    const step = FirstPassStepSchema.parse({ step: 's1', status: 'valid', reason: 'ok' });
    expect(step.wording).toEqual([]);
    expect(step.improve).toBe('');
  });

  it('demo mode corrects the solution itself: wording notes quote the student, improvements are ranked', async () => {
    const provider = new MockProvider(0);
    const recognized = JSON.parse(
      (await provider.complete({ task: 'recognize', model: 'm', messages: [], input: { problem: DEMO_PROBLEM, images: [sample('solution.png')] } })).text,
    );
    const steps = recognized.steps.map((s: { text: string }, i: number) => ({ id: `s${i + 1}`, text: s.text }));
    const result = JSON.parse(
      (await provider.complete({ task: 'evaluate', model: 'm', messages: [], input: { problem: DEMO_PROBLEM, steps } })).text,
    );
    const notes = result.steps.flatMap((s: { step: string; wording: { quote: string }[] }) =>
      s.wording.map((w) => ({ step: s.step, quote: w.quote })),
    );
    expect(notes.length).toBeGreaterThan(0);
    for (const n of notes) expect(steps.find((s: { id: string }) => s.id === n.step).text).toContain(n.quote);
    expect(result.improvements.length).toBeGreaterThan(0);
    expect(result.strengths.length).toBeGreaterThan(0);
  });
});
