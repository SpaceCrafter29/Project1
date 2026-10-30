// Splitting a problem into its parts (a), (b), … so they can be coached separately.

export interface ProblemPart {
  label: string;
  text: string;
}

export interface ProblemParts {
  /** Text before the first part (shared set-up), possibly empty. */
  stem: string;
  /** At least two parts, or none if the problem is not split. */
  parts: ProblemPart[];
}

const MARKER = /(^|\s)\(([a-h])\)\s+/g;

/**
 * Finds "(a) … (b) …" markers, at line starts or inline. Only a run a, b, c, … in
 * order counts, so a stray "(c)" in the text does not split the problem.
 */
export function parseParts(text: string): ProblemParts {
  const cuts: { label: string; at: number; end: number }[] = [];
  for (const m of text.matchAll(MARKER)) {
    const expected = String.fromCharCode(97 + cuts.length);
    if (m[2] !== expected) continue;
    const at = m.index! + m[1].length;
    cuts.push({ label: m[2], at, end: m.index! + m[0].length });
  }
  if (cuts.length < 2) return { stem: text.trim(), parts: [] };
  return {
    stem: text.slice(0, cuts[0].at).trim(),
    parts: cuts.map((c, i) => ({ label: c.label, text: text.slice(c.end, cuts[i + 1]?.at ?? text.length).trim() })),
  };
}

/** The part a step of a solution starts, e.g. "(b) Suppose …" → "b". */
export function partOfStep(text: string): string | null {
  return text.match(/^\s*\(([a-h])\)/)?.[1] ?? null;
}
