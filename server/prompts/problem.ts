// Prompts for reading the problem and the six "understanding" stages.
import type { ConjectureRequest, HintStage, TranscribeRequest } from '../../shared/api';
import type { CompletionRequest } from '../llm/types';
import {
  CHECK_CODE_RULES,
  COACH_SYSTEM,
  TABLE_CODE_RULES,
  image,
  join,
  messages,
  problemBlock,
  text,
  type Models,
} from './common';

export function transcribePrompt(input: TranscribeRequest, models: Models): CompletionRequest {
  const instruction = `Transcribe the math problem in the image(s) exactly. Do not solve it, do not comment on it, do not add hints.
- Keep the original wording and language, and all conditions, numbering and sub-parts.
- Write formulas in LaTeX ($...$).
- If something is hard to read, write your best reading and list that part in "uncertain".
- "topic" is one of: algebra, combinatorics, geometry, number theory, other.

Format:
{"text": "<full problem text>", "topic": "<topic>", "uncertain": ["<parts you were unsure about>"]}`;
  return {
    task: 'transcribe',
    model: models.fast,
    temperature: 0,
    messages: messages(COACH_SYSTEM, [text(instruction), ...input.images.map(image)]),
    input,
  };
}

const STAGE_INSTRUCTIONS: Record<HintStage, string> = {
  1: `Stage 1 of 6 – "In simple words". Restate the problem in plain, simple language a younger student would understand, without changing its meaning. Explain every technical term that appears (e.g. "divides", "integer", "convex") in the glossary. Do not hint at a method or a solution.

Format:
{"explanation": "<plain restatement, 2-5 sentences>", "glossary": [{"term": "<term>", "meaning": "<short explanation>"}]}`,

  2: `Stage 2 of 6 – "Given / wanted". List compactly what is given (objects, conditions, constraints) and what is asked (find all / prove / maximize ...). Use short bullet-like entries. Do not hint at a method or a solution. "notes" may point out easily overlooked conditions (e.g. "n is a positive integer, so n = 0 is not allowed"), or be empty.

Format:
{"given": ["..."], "wanted": ["..."], "notes": "<optional>"}`,

  3: `Stage 3 of 6 – "Small cases". Write JavaScript that computes a table of the first small cases (n = 1, 2, 3, ... or the smallest configurations) so the student can look for a pattern themselves. Choose columns that make the relevant quantities visible, but do NOT include a column that states the answer or the pattern, and do not describe the pattern in your text.

${TABLE_CODE_RULES}

Format:
{"intro": "<one sentence: what the table shows>", "code": "<function body>", "what_to_look_for": "<a neutral question that guides attention without giving the pattern away>"}`,

  5: `Stage 5 of 6 – "Method hint". Name ONE general method that is likely to work here (e.g. invariant, pigeonhole principle, induction, extremal principle, modular arithmetic, double counting, contradiction, coloring, symmetry). State the principle in one general sentence that the student can recognize in future problems. Explain why it might fit THIS problem only in terms of the problem's features, without performing any step of the solution.

Format:
{"method": "<name>", "principle_sentence": "<the general principle in one sentence>", "why_here": "<why this could fit, without solving>", "self_question": "<a question the student can ask themselves to start>"}`,

  6: `Stage 6 of 6 – "Proof skeleton". Give the structure of a complete proof as an outline WITHOUT any content: only the parts and what each part has to establish (e.g. "Case distinction: which cases must be covered", "Base case", "Induction step: what must be shown", "Conclusion"). Never state the key computations, claims or the answer.

Format:
{"parts": [{"label": "<part name>", "purpose": "<what this part must achieve, without content>"}]}`,
};

export function hintPrompt(problem: string, stage: HintStage, models: Models): CompletionRequest {
  return {
    task: `hint.${stage}` as CompletionRequest['task'],
    model: models.fast,
    temperature: 0.3,
    messages: messages(COACH_SYSTEM, join(problemBlock(problem), STAGE_INSTRUCTIONS[stage])),
    input: { problem, stage },
  };
}

export function conjecturePrompt(input: ConjectureRequest, models: Models): CompletionRequest {
  const table = input.table
    ? `SMALL-CASE TABLE the student computed:\n${input.table.columns.join(' | ')}\n${input.table.rows
        .slice(0, 30)
        .map((r) => r.join(' | '))
        .join('\n')}`
    : '';
  const instruction = `Stage 4 of 6 – "Conjecture". The student looked at small cases and wrote the conjecture below. Give feedback:
- verdict: "consistent" if it matches the data and the problem, "partly" if it is on the right track but incomplete or imprecise, "inconsistent" if the data contradicts it (then name the concrete case), "unclear" if you cannot tell.
- feedback: 1-3 sentences, encouraging and honest. Do NOT reveal the correct pattern or the answer if the conjecture is wrong; point to the case or the column to look at again.
- nudge: an optional next question that keeps the student thinking.
- check_code: when the conjecture is a testable statement, code that tests it on many more cases; check_claim states the tested claim in words.

${CHECK_CODE_RULES}

STUDENT'S CONJECTURE: """${input.conjecture.trim()}"""

Format:
{"verdict": "consistent|partly|inconsistent|unclear", "feedback": "...", "nudge": "...", "check_code": "<function body or null>", "check_claim": "..."}`;
  return {
    task: 'conjecture',
    model: models.fast,
    temperature: 0.2,
    messages: messages(COACH_SYSTEM, join(problemBlock(input.problem), table, instruction)),
    input,
  };
}
