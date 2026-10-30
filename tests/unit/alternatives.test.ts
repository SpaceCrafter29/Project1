import { describe, expect, it } from 'vitest';
import { decideAll, decideAlternative, normalizeAnswer } from '../../shared/alternatives';
import type { Verification } from '../../shared/schemas';

const valid: Verification = {
  overall: 'valid',
  steps: [{ id: 'a1', follows: 'yes', hidden_assumptions: '', comment: '' }],
  issues_summary: '',
  checks: [],
};
const pass = { claim: 'c', ran: true, holds: true, detail: 'ok' };
const fail = { claim: 'c', ran: true, holds: false, detail: 'n = 3' };

describe('normalizeAnswer', () => {
  it('compares answers independent of LaTeX formatting', () => {
    expect(normalizeAnswer('$n = 3k$')).toBe(normalizeAnswer('n=3k'));
    expect(normalizeAnswer('\\text{all } n = 3k')).toBe('alln=3k');
    expect(normalizeAnswer('n=3k')).not.toBe(normalizeAnswer('n=6k'));
  });
});

describe('decideAlternative', () => {
  it('verifies when review passes and a check ran', () => {
    expect(decideAlternative({ verification: valid, checks: [pass], answer: 'n=3k', otherAnswers: ['n = 3k'] }).verdict).toBe('verified');
  });
  it('marks logic-only solutions', () => {
    expect(decideAlternative({ verification: valid, checks: [], answer: '', otherAnswers: [] }).verdict).toBe('logic_only');
  });
  it('discards flawed or contradicted solutions', () => {
    expect(decideAlternative({ verification: { ...valid, overall: 'flawed' }, checks: [pass], answer: '', otherAnswers: [] }).verdict).toBe('discarded');
    expect(decideAlternative({ verification: valid, checks: [pass, fail], answer: '', otherAnswers: [] }).verdict).toBe('discarded');
    const broken = { ...valid, steps: [{ id: 'a2', follows: 'no' as const, hidden_assumptions: '', comment: '' }] };
    expect(decideAlternative({ verification: broken, checks: [pass], answer: '', otherAnswers: [] }).verdict).toBe('discarded');
  });
  it('marks inconsistent or uncertain results as unverified', () => {
    expect(decideAlternative({ verification: valid, checks: [pass], answer: 'n=6k', otherAnswers: ['n=3k'] }).verdict).toBe('unverified');
    expect(decideAlternative({ verification: { ...valid, overall: 'unclear' }, checks: [pass], answer: '', otherAnswers: [] }).verdict).toBe('unverified');
  });
  it('treats checks that could not run as no evidence', () => {
    const skipped = { claim: 'c', ran: false, holds: null, detail: 'timeout' };
    expect(decideAlternative({ verification: valid, checks: [skipped], answer: '', otherAnswers: [] }).verdict).toBe('logic_only');
  });
});

describe('decideAll', () => {
  it('compares results only against alternatives that survived', () => {
    const decisions = decideAll([
      { id: 'A', verification: valid, checks: [pass], answer: 'n=3k', flawedSteps: [] },
      { id: 'B', verification: valid, checks: [], answer: 'n = 3k', flawedSteps: [] },
      { id: 'C', verification: valid, checks: [fail], answer: 'n=6k', flawedSteps: [] },
    ]);
    expect(decisions.get('A')!.verdict).toBe('verified');
    expect(decisions.get('B')!.verdict).toBe('logic_only');
    expect(decisions.get('C')!.verdict).toBe('discarded');
  });
  it('marks both sides of a disagreement as unverified', () => {
    const decisions = decideAll([
      { id: 'A', verification: valid, checks: [pass], answer: 'n=3k', flawedSteps: [] },
      { id: 'B', verification: valid, checks: [pass], answer: 'n=6k', flawedSteps: [] },
    ]);
    expect(decisions.get('A')!.verdict).toBe('unverified');
    expect(decisions.get('B')!.verdict).toBe('unverified');
  });
  it('downgrades a solution with a step flawed by a student challenge', () => {
    const d = decideAll([{ id: 'A', verification: valid, checks: [pass], answer: '', flawedSteps: ['a2'] }]).get('A')!;
    expect(d.verdict).toBe('unverified');
    expect(d.reasons[0]).toContain('a2');
  });
});
