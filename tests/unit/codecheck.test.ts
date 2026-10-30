import { describe, expect, it } from 'vitest';
import { executeCode, interpretCheck, interpretTable, prepareCode, toPlain } from '../../shared/codecheck';
import { CODE } from '../../server/llm/mock/scripts/numberTheory';

const run = (code: string) => ({ status: 'ok' as const, value: toPlain(executeCode(code)), ms: 1 });

describe('executeCode', () => {
  it('runs a function body', () => {
    expect(executeCode('return 1 + 2;')).toBe(3);
  });
  it('accepts fenced code, arrow functions and declared functions', () => {
    expect(executeCode('```js\nreturn 5;\n```')).toBe(5);
    expect(executeCode('() => { return 6; }')).toBe(6);
    expect(executeCode('function check() { return { holds: true, detail: "x" }; }')).toEqual({ holds: true, detail: 'x' });
    expect(prepareCode('function f() {}')).toContain('return typeof f');
  });
  it('runs in strict mode', () => {
    expect(() => executeCode('undeclared = 1; return 1;')).toThrow();
  });
});

describe('interpretCheck', () => {
  it('reads {holds, detail}', () => {
    expect(interpretCheck(run(CODE.oddMultiples))).toEqual({ ran: true, holds: false, detail: '7 is odd and divisible by 7.' });
    expect(interpretCheck(run(CODE.period)).holds).toBe(true);
    expect(interpretCheck(run(CODE.multiplesOf6)).holds).toBe(false);
  });
  it('reports timeouts, crashes and malformed results as not run', () => {
    expect(interpretCheck({ status: 'timeout', ms: 3000 }).ran).toBe(false);
    expect(interpretCheck({ status: 'error', error: 'x', ms: 1 }).ran).toBe(false);
    expect(interpretCheck({ status: 'ok', value: 42, ms: 1 }).ran).toBe(false);
  });
});

describe('interpretTable', () => {
  it('reads the demo small-case table with BigInt values', () => {
    const result = interpretTable(run(CODE.table));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.table.columns).toHaveLength(5);
    expect(result.table.rows).toHaveLength(15);
    expect(result.table.rows[14][1]).toBe('32768');
  });
  it('rejects other shapes', () => {
    expect(interpretTable({ status: 'ok', value: [1, 2], ms: 1 }).ok).toBe(false);
  });
});

describe('toPlain', () => {
  it('converts BigInt and drops functions', () => {
    expect(toPlain({ a: 10n ** 30n, f: () => 1, s: new Set([1]) })).toEqual({ a: '1000000000000000000000000000000', f: undefined, s: [1] });
  });
});
