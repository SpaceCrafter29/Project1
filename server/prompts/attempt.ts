// Prompts for reading, judging and discussing the student's handwritten solution.
import type { DiscussRequest, EvaluateRequest, RecognizeRequest, SolutionStep } from '../../shared/api';
import type { FirstPassStep } from '../../shared/schemas';
import type { CompletionRequest } from '../llm/types';
import {
  CHECK_CODE_RULES,
  COACH_SYSTEM,
  REVIEWER_SYSTEM,
  historyBlock,
  image,
  join,
  messages,
  problemBlock,
  stepsBlock,
  text,
  type Models,
} from './common';

export function recognizePrompt(input: RecognizeRequest, models: Models): CompletionRequest {
  const what = input.partial
    ? "the student's unfinished work on the problem above (computations, sketches, conjectures, attempts – possibly several pages, in order)"
    : "the student's handwritten solution to the problem above (possibly several pages, in order)";
  const instruction = `The image(s) show ${what}. Transcribe it faithfully as a list of steps.
- One step = one claim, computation or conclusion, in the student's order. Keep the student's wording and notation; do not fix mistakes, do not fill gaps, do not add steps, do not judge.
- Formulas in LaTeX ($...$). Crossed-out text is omitted.
- Set "unclear": true for a step you could not read with confidence, and list illegible fragments in "unreadable".

Format:
{"steps": [{"text": "<step>", "unclear": false}], "unreadable": ["<fragment>"]}`;
  return {
    task: 'recognize',
    model: models.fast,
    temperature: 0,
    messages: messages(COACH_SYSTEM, [text(join(problemBlock(input.problem), instruction)), ...input.images.map(image)]),
    input,
  };
}

export function evaluatePrompt(input: EvaluateRequest, models: Models): CompletionRequest {
  const idea = input.intendedIdea
    ? `The student wrote this solution to practice a specific idea: "${input.intendedIdea}". Judge the solution exactly like any other, and additionally report in "idea_used" (yes/partly/no) and "idea_comment" whether that idea is actually used.`
    : '';
  const instruction = `Evaluate every step of the student's solution, in order. Start from what the student wrote; do not compare with any other solution.
For each step give:
- status: "valid" (correct and justified by the problem or earlier steps), "gap" (the claim may be true but its justification is missing or incomplete), "error" (the claim is false or the computation is wrong), or "unclear" (you are not sure).
- quote: for "gap" and "error", the exact words from the step that are problematic, copied verbatim (shorten with "..." if long). Empty for "valid".
- reason: one or two sentences. For "valid", say what it follows from (e.g. "follows from [s2] because ..."). For "gap"/"error", what exactly is missing or wrong.
- evidence: for "error", a concrete counterexample or recomputation; for "gap", the precise inference that is not justified. Without concrete evidence use "unclear" instead.
- deduction: how many of the 7 points this issue costs (0 for valid).
- check_code / check_claim: when the step makes a numerically testable claim (always try for "error"), code that tests the STUDENT'S claim and the claim in words.
Then:
- score: estimated points 0-7 for the whole solution as it stands, in the style of olympiad grading (an incomplete but correct start can earn partial points).
- summary: 1-2 sentences, encouraging and honest, without revealing a solution.
In case of doubt, choose "unclear" rather than "gap" or "error".

${CHECK_CODE_RULES}

Format:
{"steps": [{"step": "<step id, e.g. s1>", "status": "valid|gap|error|unclear", "quote": "", "reason": "", "evidence": "", "deduction": 0, "check_code": null, "check_claim": ""}], "score": 0, "summary": ""${input.intendedIdea ? ', "idea_used": "yes|partly|no", "idea_comment": ""' : ''}}`;
  return {
    task: 'evaluate',
    model: models.fast,
    temperature: 0,
    messages: messages(COACH_SYSTEM, join(problemBlock(input.problem), stepsBlock(input.steps), idea, instruction)),
    input,
  };
}

export interface RefuteInput {
  problem: string;
  steps: SolutionStep[];
  critique: FirstPassStep;
}

/** A fresh call that tries to show the critique is wrong ("Versuche zu widerlegen, dass dieser Schritt falsch ist"). */
export function refutePrompt(input: RefuteInput, models: Models): CompletionRequest {
  const c = input.critique;
  const instruction = `A first reviewer criticized step [${c.step}] of the student's solution:
- verdict: ${c.status === 'gap' ? 'gap (justification missing)' : 'error (the claim is false or miscomputed)'}
- quoted words: "${c.quote}"
- reason: ${c.reason}
- evidence: ${c.evidence || '(none given)'}

Your job: try hard to REFUTE this critique, i.e. try to show that step [${c.step}] is actually fine. Consider: Does the step follow from the problem statement or from earlier steps after all? Is the student's wording being read uncharitably? Is the counterexample or recomputation itself wrong? Is the critique about something the student did not claim?
Only if every attempt fails and the critique is concrete and correct, set "upheld": true. Otherwise set "upheld": false and explain why the step can be defended or why the critique is not convincing.

Format:
{"upheld": true|false, "reasoning": "<2-4 sentences>"}`;
  return {
    task: 'refute',
    model: models.verifier,
    temperature: 0,
    messages: messages(REVIEWER_SYSTEM, join(problemBlock(input.problem), stepsBlock(input.steps), instruction)),
    input,
  };
}

export function discussPrompt(input: DiscussRequest, models: Models): CompletionRequest {
  const step = input.steps.find((s) => s.id === input.stepId);
  const instruction = `You discuss step [${input.stepId}] with the student, as equals. Earlier you (the coach) gave this verdict:
- verdict: ${input.critique.status}
- quoted words: "${input.critique.quote}"
- reason: ${input.critique.reason}
- evidence: ${input.critique.evidence || '(none)'}
The student disagrees or asks about it. Rules of the discussion:
- Judge only mathematical validity. Never appeal to another solution, a reference solution, the internet or authority.
- State your concern precisely ("I read step ${input.stepId} as: ... The problem I see is ...") and take the student's explanation seriously.
- If the student's meaning is ambiguous, ask a precise question instead of assuming (outcome "clarify").
- Settle disagreements concretely: a counterexample, a small case, or a code test (check_code). Do not just repeat yourself.
- If the student is right, say so plainly ("You are right, I overlooked ...") and use outcome "agree_valid". Do not hold on to a claim to be right, and do not give in just to be nice.
- If it cannot be settled now, use outcome "open" and describe in "open_point" exactly what would still have to be shown.
- Otherwise ("maintain") explain once more, more concretely than before. Tone: respectful, curious, no lecturing. Keep it short.

${CHECK_CODE_RULES}

Format:
{"reply": "<your message to the student>", "outcome": "agree_valid|maintain|clarify|open", "open_point": "", "check_code": null, "check_claim": ""}`;
  return {
    task: 'discuss',
    model: models.fast,
    temperature: 0.2,
    messages: messages(
      COACH_SYSTEM,
      join(
        problemBlock(input.problem),
        stepsBlock(input.steps),
        step ? `STEP UNDER DISCUSSION: [${step.id}] ${step.text}` : '',
        historyBlock(input.history),
        instruction,
      ),
    ),
    input,
  };
}
