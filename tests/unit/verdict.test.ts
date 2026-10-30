import { describe, expect, it } from 'vitest';
import type { FirstPassStep } from '../../shared/schemas';
import { applyDiscussion, mergeVerdict, quoteFound, scoreRange } from '../../shared/verdict';

const step = (over: Partial<FirstPassStep>): FirstPassStep => ({
  step: 's1',
  status: 'error',
  quote: 'an odd number cannot be divisible by 7',
  reason: 'False claim.',
  evidence: '21 = 3 * 7',
  deduction: 2,
  check_code: null,
  check_claim: '',
  ...over,
});
const text = 'But $2^n + 1$ is always odd, and an odd number cannot be divisible by 7.';
const upheld = { upheld: true, reasoning: 'Could not defend it.' };

describe('quoteFound', () => {
  it('matches verbatim quotes, ignoring spacing and $ signs', () => {
    expect(quoteFound('an odd number cannot be divisible by 7', text)).toBe(true);
    expect(quoteFound('2^n+1 is always odd', text)).toBe(true);
    expect(quoteFound('$2^n + 1$ is always ... divisible by 7', text)).toBe(true);
  });

  it('rejects paraphrases, reordered fragments and empty quotes', () => {
    expect(quoteFound('odd numbers are never multiples of 7', text)).toBe(false);
    expect(quoteFound('divisible by 7 ... always odd', text)).toBe(false);
    expect(quoteFound('', text)).toBe(false);
    expect(quoteFound('an', text)).toBe(false);
  });
});

describe('mergeVerdict', () => {
  it('shows an error only when quoted, upheld and not contradicted', () => {
    const v = mergeVerdict({ stepText: text, firstPass: step({}), refutation: upheld });
    expect(v.status).toBe('error');
  });

  it('downgrades to unclear when the independent check does not uphold the critique', () => {
    const v = mergeVerdict({ stepText: text, firstPass: step({}), refutation: { upheld: false, reasoning: 'It follows.' } });
    expect(v.status).toBe('unclear');
    expect(v.notes.join(' ')).toContain('could not confirm');
  });

  it('downgrades to unclear without a refutation or with a non-verbatim quote', () => {
    expect(mergeVerdict({ stepText: text, firstPass: step({}), refutation: null }).status).toBe('unclear');
    expect(mergeVerdict({ stepText: text, firstPass: step({ quote: 'something else entirely' }), refutation: upheld }).status).toBe('unclear');
  });

  it('confirms an error by a code counterexample', () => {
    const v = mergeVerdict({
      stepText: text,
      firstPass: step({}),
      refutation: upheld,
      check: { ran: true, holds: false, detail: '7 is odd and divisible by 7.' },
    });
    expect(v.status).toBe('error');
    expect(v.notes.join(' ')).toContain('counterexample');
  });

  it('turns an error into unclear when code finds no counterexample', () => {
    const v = mergeVerdict({ stepText: text, firstPass: step({}), refutation: upheld, check: { ran: true, holds: true, detail: 'ok' } });
    expect(v.status).toBe('unclear');
  });

  it('keeps a gap when the claim holds numerically (true but unjustified)', () => {
    const v = mergeVerdict({
      stepText: 'remainders repeat with period 3',
      firstPass: step({ status: 'gap', quote: 'repeat with period 3' }),
      refutation: upheld,
      check: { ran: true, holds: true, detail: 'n <= 3000' },
    });
    expect(v.status).toBe('gap');
  });

  it('upgrades a gap to an error when code refutes the claim', () => {
    const v = mergeVerdict({
      stepText: 'remainders repeat with period 3',
      firstPass: step({ status: 'gap', quote: 'repeat with period 3' }),
      refutation: upheld,
      check: { ran: true, holds: false, detail: 'n = 4' },
    });
    expect(v.status).toBe('error');
  });

  it('flags a "valid" step as unclear when code finds a counterexample', () => {
    const v = mergeVerdict({
      stepText: text,
      firstPass: step({ status: 'valid', quote: '' }),
      refutation: null,
      check: { ran: true, holds: false, detail: 'n = 5' },
    });
    expect(v.status).toBe('unclear');
  });

  it('ignores checks that could not run', () => {
    const v = mergeVerdict({ stepText: text, firstPass: step({}), refutation: upheld, check: { ran: false, holds: null, detail: 'timeout' } });
    expect(v.status).toBe('error');
    expect(v.notes[0]).toContain('could not decide');
  });
});

describe('applyDiscussion', () => {
  const base = { status: 'error' as const, reason: 'r', notes: [] };
  it('accepts the coach conceding', () => {
    expect(applyDiscussion(base, 'agree_valid').status).toBe('valid');
  });
  it('leaves open points unclear', () => {
    const v = applyDiscussion(base, 'open', 'Show the pattern continues.');
    expect(v.status).toBe('unclear');
    expect(v.reason).toContain('Show the pattern');
  });
  it('keeps the verdict when maintained', () => {
    expect(applyDiscussion(base, 'maintain')).toBe(base);
  });
});

describe('scoreRange', () => {
  const s = (status: FirstPassStep['status'], deduction: number, final: FirstPassStep['status']) => ({
    firstPass: { status, deduction },
    final: { status: final },
  });
  it('widens the range for unclear critiques and restores withdrawn ones', () => {
    expect(scoreRange(3, [s('gap', 1, 'gap'), s('error', 1, 'unclear'), s('error', 2, 'error')])).toEqual({ low: 3, high: 4 });
    expect(scoreRange(3, [s('gap', 1, 'gap'), s('error', 1, 'valid'), s('error', 2, 'error')])).toEqual({ low: 4, high: 4 });
  });
  it('clamps to 0..7', () => {
    expect(scoreRange(6, [s('error', 3, 'valid')])).toEqual({ low: 7, high: 7 });
  });
});
