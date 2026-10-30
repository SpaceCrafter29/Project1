// Execution and interpretation of model-written JavaScript checks and figures.
// executeCode runs inside a Web Worker in the browser (see src/workers/sandbox.worker.ts)
// and directly in unit tests; everything else here is pure.
import { geo, type P } from './geo';

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

  // `() => {...}` or `async (free) => {...}`: call it.
  if (/^(async\s*)?\([^)]*\)\s*=>/.test(code)) {
    return `return (${code})(free, geo);`;
  }
  // `function check() {...}`: call the declared function if the body did not return earlier.
  const decl = code.match(/^(async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/);
  if (decl) {
    const name = decl[2];
    return `${code}\n;return typeof ${name} === 'function' ? ${name}(free, geo) : undefined;`;
  }
  return code;
}

export interface RunArgs {
  /** Current positions of the draggable points of a figure. */
  free?: Record<string, P>;
}

/** Runs a function body in strict mode with `geo` and `free` in scope. May return a Promise. */
export function executeCode(raw: string, args: RunArgs = {}): unknown {
  const fn = new Function('geo', 'free', `"use strict";\n${prepareCode(raw)}`);
  return fn(geo, args.free ?? {});
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

// ---------------------------------------------------------------------------
// Figures (geometry): code receives `free` points and returns what to draw.

export interface Figure {
  points: Record<string, P>;
  segments: [string, string][];
  /** Infinite lines through two named points. */
  lines: [string, string][];
  polygons: { points: string[]; fill: boolean }[];
  circles: { center: P; radius: number }[];
  measures: { label: string; value: string }[];
}

const isNum = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x);

function toPoint(v: unknown): P | null {
  if (Array.isArray(v) && isNum(v[0]) && isNum(v[1])) return [v[0], v[1]];
  const o = v as { x?: unknown; y?: unknown } | null;
  if (o && isNum(o.x) && isNum(o.y)) return [o.x, o.y];
  return null;
}

function formatMeasure(v: unknown): string {
  if (isNum(v)) {
    const rounded = Math.abs(v) < 5e-10 ? 0 : v;
    return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(4);
  }
  return typeof v === 'boolean' ? (v ? 'yes' : 'no') : String(v ?? '');
}

/** Reads figure code output leniently; unknown or broken parts are dropped. */
export function interpretFigure(
  run: CodeRunResult,
  free: Record<string, P> = {},
): { ok: true; figure: Figure } | { ok: false; error: string } {
  if (run.status !== 'ok') {
    return { ok: false, error: run.status === 'timeout' ? 'The figure took too long to compute.' : `Error: ${run.error}` };
  }
  const v = run.value as Record<string, unknown> | undefined;
  if (!v || typeof v !== 'object') return { ok: false, error: 'The figure code did not return an object.' };

  const points: Record<string, P> = {};
  for (const [name, raw] of Object.entries((v.points as Record<string, unknown>) ?? {})) {
    const p = toPoint(raw);
    if (p) points[name] = p;
  }
  for (const [name, p] of Object.entries(free)) points[name] = p;

  const pair = (x: unknown): [string, string] | null =>
    Array.isArray(x) && x.length === 2 && points[x[0]] && points[x[1]] ? [String(x[0]), String(x[1])] : null;
  const pairs = (x: unknown) => (Array.isArray(x) ? x.map(pair).filter((y): y is [string, string] => !!y) : []);

  const polygons = (Array.isArray(v.polygons) ? v.polygons : [])
    .map((poly: unknown) => {
      const o = poly as { points?: unknown; fill?: unknown };
      const names = (Array.isArray(poly) ? poly : Array.isArray(o?.points) ? o.points : []) as unknown[];
      const valid = names.map(String).filter((n) => points[n]);
      return valid.length >= 3 ? { points: valid, fill: !Array.isArray(poly) && o.fill === true } : null;
    })
    .filter((p): p is { points: string[]; fill: boolean } => !!p);

  const circles = (Array.isArray(v.circles) ? v.circles : [])
    .map((c: unknown) => {
      const o = c as { center?: unknown; radius?: unknown; through?: unknown };
      const center = typeof o?.center === 'string' ? points[o.center] : toPoint(o?.center);
      if (!center) return null;
      const through = typeof o.through === 'string' ? points[o.through] : toPoint(o.through);
      const radius = isNum(o.radius) ? o.radius : through ? Math.hypot(through[0] - center[0], through[1] - center[1]) : NaN;
      return isNum(radius) && radius > 0 ? { center, radius } : null;
    })
    .filter((c): c is { center: P; radius: number } => !!c);

  const rawMeasures = v.measures;
  const measures = Array.isArray(rawMeasures)
    ? rawMeasures
        .map((m: unknown) => m as { label?: unknown; value?: unknown })
        .filter((m) => m && m.label != null)
        .map((m) => ({ label: String(m.label), value: formatMeasure(m.value) }))
    : Object.entries((rawMeasures as Record<string, unknown>) ?? {}).map(([label, value]) => ({ label, value: formatMeasure(value) }));

  if (Object.keys(points).length === 0) return { ok: false, error: 'The figure has no points.' };
  return {
    ok: true,
    figure: { points, segments: pairs(v.segments), lines: pairs(v.lines), polygons, circles, measures: measures.slice(0, 12) },
  };
}
