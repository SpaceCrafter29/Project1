import type { ChatTurn, SolutionStep } from '../../shared/api';
import { GEO_REFERENCE } from '../../shared/geo';
import type { ChatMessage, ContentPart } from '../llm/types';

export interface Models {
  fast: string;
  solver: string;
  verifier: string;
}

const OUTPUT_RULES = `Output rules:
- Write mathematics in LaTeX: $...$ inline, $$...$$ for displayed formulas. Escape backslashes as required inside JSON strings.
- Answer with exactly one JSON object in the requested format. No markdown fences, no text before or after it.`;

/** The coach persona used for everything the student sees while working on the problem. */
export const COACH_SYSTEM = `You are an experienced math olympiad coach. Your goal is that the student understands the problem and writes their own proof.
Core rules:
- Never reveal the solution, the key idea or the final answer unless the student explicitly opened a model solution. Give only the stage or help that is asked for.
- Judge only mathematical validity. Every correct, gap-free argument is good, no matter how long or unusual. There is no reference solution, and you never argue that something is wrong because another solution exists or because it differs from a known solution.
- Never call something wrong without quoting the exact words and giving concrete evidence: a counterexample, a recomputation, or the precise inference that is not justified. If you are not sure, say "unclear".
- Be respectful, curious and concise. Ask instead of assuming when the student's meaning is ambiguous.
${OUTPUT_RULES}`;

/** For independent checks: a fresh reviewer that has not produced the text under review. */
export const REVIEWER_SYSTEM = `You are a meticulous, independent reviewer of olympiad mathematics. You did not write the text you review and you have no stake in it being right or wrong.
- Judge only mathematical validity; length, style and unusual methods are irrelevant.
- Be concrete: quote exact words, give counterexamples, recompute.
- If you cannot decide, say so instead of guessing.
${OUTPUT_RULES}`;

export const CHECK_CODE_RULES = `About "check_code": optional JavaScript that tests a concrete, numerically testable claim (e.g. a divisibility statement for n up to 1000, an inequality on random inputs, a counterexample search). Rules:
- It is the BODY of a function without parameters (no function header) and must end with \`return {holds: <boolean>, detail: <string>}\`.
- holds=true means the claim survived the test; holds=false means a counterexample was found; put the concrete counterexample or the tested range into detail.
- It runs in a sandbox without network, DOM or imports and must finish within 2 seconds. Use BigInt for integers above 2^53.
- Geometry claims are tested on many random configurations (e.g. 1000 random triangles) with coordinates; compare with geo.approx, never with ===.
- ${GEO_REFERENCE}
- Test the mathematical claim itself, never your own opinion about it. Use null when nothing is numerically testable.`;

export const FIGURE_CODE_RULES = `About figure code: JavaScript that constructs the figure from draggable points, so the student can move them and watch what changes and what stays the same.
- It is the BODY of a function without parameters. The variable \`free\` holds the current draggable points, e.g. \`const { A, B, C } = free;\`, and \`geo\` holds helpers.
- It must return {points: {name: [x, y], ...}, segments: [["A","B"], ...], lines: [["A","B"]] (infinite lines), polygons: [{points: ["A","B","C"], fill: false}], circles: [{center: "O", through: "A"} or {center: "O", radius: 2}], measures: [{label: "AB", value: number}, ...]}.
- Choose measures that are worth watching (lengths, angles, ratios, areas), but do not label any measure with the claim or the answer.
- free_points gives the starting position of every draggable point, in a general position (no accidental symmetry), coordinates roughly between -10 and 10.
- It runs in a sandbox without network, DOM or imports and must be fast (it runs on every drag).
- ${GEO_REFERENCE}`;

export const TABLE_CODE_RULES = `About "code": JavaScript that computes the small cases. Rules:
- It is the BODY of a function without parameters (no function header) and must end with \`return {columns: [...], rows: [[...], ...]}\`, where every row has one entry per column (numbers or short strings).
- At most 30 rows. It runs in a sandbox without network, DOM or imports and must finish within 2 seconds. Use BigInt for integers above 2^53 and convert them to strings.`;

export function problemBlock(problem: string): string {
  return `PROBLEM:\n"""\n${problem.trim()}\n"""`;
}

export function stepsBlock(steps: SolutionStep[], title = "STUDENT'S SOLUTION (confirmed by the student)"): string {
  const lines = steps.map((s) => `[${s.id}] ${s.text.trim()}`).join('\n');
  return `${title}:\n${lines}`;
}

export function historyBlock(history: ChatTurn[]): string {
  if (history.length === 0) return '';
  const label = { user: 'STUDENT', coach: 'COACH', check: 'CODE CHECK RESULT' } as const;
  return `CONVERSATION SO FAR:\n${history.map((t) => `${label[t.role]}: ${t.text}`).join('\n')}`;
}

export function image(url: string): ContentPart {
  return { type: 'image_url', image_url: { url } };
}

export function text(t: string): ContentPart {
  return { type: 'text', text: t };
}

export function messages(system: string, user: string | ContentPart[]): ChatMessage[] {
  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ];
}

export function join(...parts: (string | false | undefined | null)[]): string {
  return parts.filter(Boolean).join('\n\n');
}
