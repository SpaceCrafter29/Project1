// Execution and interpretation of model-written JavaScript checks.
// executeCode runs inside a Web Worker in the browser (see src/workers/sandbox.worker.ts)
// and directly in unit tests; everything else here is pure.

export type CodeRunStatus = 'ok' | 'error' | 'timeout';

export interface CodeRunResult {
  status: CodeRunStatus;
  value?: unknown;
  error?: string;
  ms: number;
}

/** What a `{holds, detail}` check means after running. */
export interface CheckOutcome {
  /** True when the code ran and returned a usable verdict. */
  ran: boolean;
  /** true: the claim survived the test, false: counterexample found, null: no verdict. */
  holds: boolean | null;
  detail: string;
}

export interface Table {
  columns: string[];
  rows: (string | number)[][];
}

export const MAX_TABLE_ROWS = 200;

/** Turns model output into an executable function body. */
export function prepareCode(raw: string): string {
  let code = raw.trim();
  const fence = code.match(/^```[a-zA-Z]*\s*\n([\s\S]*?)\n?```\s*$/);
  if (fence) code = fence[1].trim();

  // `() => {...}` or `async () => {...}`: call it.
  if (/^(async\s*)?\([^)]*\)\s*=>/.test(code)) {
    return `return (${code})();`;
  }
  // `function check() {...}`: call the declared function if the body did not return earlier.
  const decl = code.match(/^(async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/);
  if (decl) {
    const name = decl[2];
    return `${code}\n;return typeof ${name} === 'function' ? ${name}() : undefined;`;
  }
  return code;
}

/** Runs a function body in strict mode. May return a Promise. */
export function executeCode(raw: string): unknown {
  const fn = new Function(`"use strict";\n${prepareCode(raw)}`);
  return fn();
}

/** Makes a value safe to postMessage/serialize: BigInt -> string, bounded size/depth. */
export function toPlain(value: unknown, depth = 0): unknown {
  if (typeof value === 'bigint') return value.toString();
  if (value === null || typeof value === 'number' || typeof value === 'string' || typeof value === 'boolean') {
    return value;
  }
  if (value === undefined || typeof value === 'function' || typeof value === 'symbol') return undefined;
  if (depth > 6) return '[…]';
  if (Array.isArray(value)) return value.slice(0, 1000).map((v) => toPlain(v, depth + 1));
  if (value instanceof Map) return toPlain(Object.fromEntries(value), depth);
  if (value instanceof Set) return toPlain([...value], depth);
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>).slice(0, 200)) {
      out[k] = toPlain(v, depth + 1);
    }
    return out;
  }
  return String(value);
}

export function interpretCheck(run: CodeRunResult): CheckOutcome {
  if (run.status === 'timeout') {
    return { ran: false, holds: null, detail: `The check did not finish within ${Math.round(run.ms)} ms.` };
  }
  if (run.status === 'error') {
    return { ran: false, holds: null, detail: `The check crashed: ${run.error ?? 'unknown error'}` };
  }
  const v = run.value as { holds?: unknown; detail?: unknown } | boolean | undefined;
  if (typeof v === 'boolean') return { ran: true, holds: v, detail: '' };
  if (v && typeof v === 'object' && typeof v.holds === 'boolean') {
    return { ran: true, holds: v.holds, detail: v.detail == null ? '' : String(v.detail) };
  }
  return { ran: false, holds: null, detail: 'The check did not return {holds, detail}.' };
}

export function interpretTable(run: CodeRunResult): { ok: true; table: Table } | { ok: false; error: string } {
  if (run.status !== 'ok') {
    return { ok: false, error: run.status === 'timeout' ? 'The computation timed out.' : `Error: ${run.error}` };
  }
  const v = run.value as { columns?: unknown; rows?: unknown } | undefined;
  if (!v || !Array.isArray(v.columns) || !Array.isArray(v.rows)) {
    return { ok: false, error: 'The code did not return {columns, rows}.' };
  }
  const columns = v.columns.map((c) => String(c));
  const rows = v.rows.slice(0, MAX_TABLE_ROWS).map((row) =>
    (Array.isArray(row) ? row : [row]).map((cell) =>
      typeof cell === 'number' ? cell : cell == null ? '' : String(cell),
    ),
  );
  return { ok: true, table: { columns, rows } };
}
