// Prompts for reading the problem, the personalized tip loop, and the tools a tip can attach.
import type { HintStage, NextHintRequest, TranscribeRequest } from '../../shared/api';
import type { CompletionRequest } from '../llm/types';
import {
  CHECK_CODE_RULES,
  COACH_SYSTEM,
  FIGURE_CODE_RULES,
  TABLE_CODE_RULES,
  image,
  join,
  messages,
  problemBlock,
  stepsBlock,
  text,
  type Models,
} from './common';

export function transcribePrompt(input: TranscribeRequest, models: Models): CompletionRequest {
  const instruction = `Transcribe the math problem in the image(s) exactly. Do not solve it, do not comment on it, do not add hints.
- Keep the original wording and language, and all conditions, numbering and sub-parts.
- Write formulas in LaTeX ($...$).
- If something is hard to read, write your best reading and list that part in "uncertain".
- "topic" is one of: algebra, combinatorics, geometry, number theory, other.
- "figure": if the image contains a figure, describe it precisely in words: the points and their labels, segments, circles, which points lie on which lines or circles, and any marked lengths, angles or right angles. Only describe what is drawn, never what it suggests. Empty string if there is no figure.

Format:
{"text": "<full problem text>", "topic": "<topic>", "figure": "<figure description or empty>", "uncertain": ["<parts you were unsure about>"]}`;
  return {
    task: 'transcribe',
    model: models.fast,
    temperature: 0,
    messages: messages(COACH_SYSTEM, [text(instruction), ...input.images.map(image)]),
    input,
  };
}

const STAGE_INSTRUCTIONS: Record<HintStage, string> = {
  1: `Tool – "In simple words". Restate the problem in plain, simple language a younger student would understand, without changing its meaning. Explain every technical term that appears (e.g. "divides", "integer", "convex") in the glossary. Do not hint at a method or a solution.

Format:
{"explanation": "<plain restatement, 2-5 sentences>", "glossary": [{"term": "<term>", "meaning": "<short explanation>"}]}`,

  2: `Tool – "Given / wanted". List compactly what is given (objects, conditions, constraints) and what is asked (find all / prove / maximize ...). Use short bullet-like entries. Do not hint at a method or a solution. "notes" may point out easily overlooked conditions (e.g. "n is a positive integer, so n = 0 is not allowed"), or be empty.

Format:
{"given": ["..."], "wanted": ["..."], "notes": "<optional>"}`,

  3: `Tool – "Small cases / experiment". Let the student experiment so they can find a pattern themselves. Do not describe the pattern or the answer in your text.
- For a GEOMETRY problem use kind "figure": write figure code that constructs the configuration from draggable points, with measures that make relevant quantities visible while the student drags.
- Otherwise use kind "table": write code that computes a table of the first small cases (n = 1, 2, 3, ... or the smallest configurations). Choose columns that make the relevant quantities visible, but do NOT include a column that states the answer or the pattern.

${TABLE_CODE_RULES}

${FIGURE_CODE_RULES}

Format:
{"kind": "table|figure", "intro": "<one sentence: what the table or figure shows>", "code": "<function body>", "free_points": {"A": [0, 0]} (figure only, else {}), "what_to_look_for": "<a neutral question that guides attention without giving the pattern away>"}`,

  5: `Tool – "Method hint". Name ONE general method that is likely to work here (e.g. invariant, pigeonhole principle, induction, extremal principle, modular arithmetic, double counting, contradiction, coloring, symmetry). State the principle in one general sentence that the student can recognize in future problems. Explain why it might fit THIS problem only in terms of the problem's features, without performing any step of the solution.

Format:
{"method": "<name>", "principle_sentence": "<the general principle in one sentence>", "why_here": "<why this could fit, without solving>", "self_question": "<a question the student can ask themselves to start>"}`,

  6: `Tool – "Proof skeleton". Give the structure of a complete proof as an outline WITHOUT any content: only the parts and what each part has to establish (e.g. "Case distinction: which cases must be covered", "Base case", "Induction step: what must be shown", "Conclusion"). Never state the key computations, claims or the answer.

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

export function nextHintPrompt(input: NextHintRequest, models: Models): CompletionRequest {
  const history = input.history.length
    ? `TIPS YOU ALREADY GAVE (oldest first):\n${input.history.map((h, i) => `Tip ${i + 1} (level ${h.level}): ${h.hint}`).join('\n')}`
    : 'This is the first tip; the student has just read the problem.';
  const previous = input.previousProgress.length ? stepsBlock(input.previousProgress, "STUDENT'S WORK AT THE PREVIOUS TIP") : '';
  const current = input.progress.length
    ? stepsBlock(input.progress, "STUDENT'S CURRENT WORK (from their latest photo, confirmed by them; may be unfinished)")
    : "STUDENT'S CURRENT WORK: nothing written yet.";
  const note = input.note.trim() ? `STUDENT'S NOTE: """${input.note.trim()}"""` : '';
  const instruction = `The student works on paper and photographs their progress; after each photo you give exactly ONE next tip, tailored to where they are. Rules:
- progress: first acknowledge concretely what they have already achieved (one sentence, refer to their steps). Empty if they have nothing yet.
- hint: find the single most important next thing (the next idea, the first gap, or a wrong turn) and give the smallest nudge that lets them continue ON THEIR OWN. Never write out the solution, a proof step or the final answer.
- Build on THEIR approach. Only steer them elsewhere if their approach cannot work, and then say why in one sentence.
- level: if they made no real progress since the previous tip (compare their work at the previous tip with their current work, and read their note), make this tip exactly one level more concrete than the last one. If they moved on to a new point, start again at level 1. Level 1 = a direction, level 2 = a concrete idea, level 3 = the key insight of the next step stated plainly (but they still write it down themselves).
- If something in their work looks false, do not declare it wrong: point at it with a question ("check step s3 for n = 2"). If the claim is numerically testable, add check_code that tests THEIR claim; the app runs it and shows the result.
- question: one question they can think about while working.
- tool: optionally attach ONE tool that helps right now – "simple_words" (they do not understand the statement), "given_wanted" (they lose track of what is given and asked), "small_cases" (they need data or an experiment; for geometry this is an interactive figure), "method" (they need a general method), "skeleton" (they have the ideas but no structure) – or "none". Do not attach a tool you already effectively gave.
- status: "not_started", "on_track", "stuck", "off_track", or "complete" (their work looks like a complete solution: then the tip says so and suggests submitting it for the full check; you may still name one thing to double-check).
- focus_step: the id of the step your tip is about, or null.

${CHECK_CODE_RULES}

Format:
{"progress": "", "status": "not_started|on_track|stuck|off_track|complete", "hint": "", "question": "", "level": 1, "tool": "none|simple_words|given_wanted|small_cases|method|skeleton", "focus_step": null, "check_code": null, "check_claim": ""}`;
  return {
    task: 'nexthint',
    model: models.fast,
    temperature: 0.3,
    messages: messages(COACH_SYSTEM, join(problemBlock(input.problem), history, previous, current, note, instruction)),
    input,
  };
}
