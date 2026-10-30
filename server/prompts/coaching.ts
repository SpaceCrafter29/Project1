// Prompts for questions about marked regions, correcting the student's approach,
// and the alternative-approaches pipeline (propose -> solve -> verify, plus challenges).
import type {
  AskRequest,
  ChallengeRequest,
  CorrectRequest,
  ProposeRequest,
} from '../../shared/api';
import type { Idea, Solution } from '../../shared/schemas';
import type { CompletionRequest } from '../llm/types';
import {
  CHECK_CODE_RULES,
  COACH_SYSTEM,
  FIGURE_CODE_RULES,
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

export function askPrompt(input: AskRequest, models: Models): CompletionRequest {
  const question = input.question.trim() || 'Explain this.';
  const rules = `Answer the student's question about the MARKED part only. Be short and concrete (2-6 sentences).
- If the question is "Explain this", explain what the marked part says or does, and how it connects to the rest.
- If the student asks whether something there is wrong, follow the evidence rules: quote exact words and give a counterexample or recomputation, or say it is unclear.
- Answer in plain text (LaTeX allowed), inside the JSON field "answer".`;

  if (input.context.kind === 'image') {
    const intro = `The student circled a region of their own handwritten solution. The FIRST image is the cropped marked region, the SECOND image is the whole page for context. Do not reveal a solution to the problem; help with the marked part.`;
    const body = join(
      problemBlock(input.problem),
      input.studentSteps?.length ? stepsBlock(input.studentSteps) : '',
      intro,
      historyBlock(input.history),
      `STUDENT'S QUESTION: """${question}"""`,
      rules,
      'Format:\n{"answer": "..."}',
    );
    return {
      task: 'ask',
      model: models.fast,
      temperature: 0.2,
      messages: messages(COACH_SYSTEM, [text(body), image(input.context.crop), image(input.context.fullImage)]),
      input,
    };
  }

  const marked = input.context.marked.map((s) => `[${s.id}] ${s.text}`).join('\n');
  const body = join(
    problemBlock(input.problem),
    stepsBlock(input.context.solution, 'MODEL SOLUTION (the student opened it on purpose)'),
    `MARKED STEP(S):\n${marked}`,
    historyBlock(input.history),
    `STUDENT'S QUESTION: """${question}"""`,
    rules,
    'Format:\n{"answer": "..."}',
  );
  return { task: 'ask', model: models.fast, temperature: 0.2, messages: messages(COACH_SYSTEM, body), input };
}

export function correctPrompt(input: CorrectRequest, models: Models): CompletionRequest {
  const verdicts = input.verdicts
    .map((v) => `[${v.stepId}] ${v.status.toUpperCase()}: ${v.reason}`)
    .join('\n');
  const instruction = `Work on the student's OWN approach. Never start a new solution and never replace their idea with yours. Every correct way counts as good, even if it is long or unusual.
Identify the approach(es) the student used (usually one; more if they tried several), and for each one give a card:
- name: a short name for the approach, in the student's terms (e.g. "Listing remainders mod 7").
- approach_works: "yes" if it can carry a complete proof as is, "partly" if it carries with a repair, "no" if it cannot work even with repairs.
- works_why: one or two sentences why.
- fails_at: the id of the step where it breaks (e.g. "s3"), or null if nothing breaks. Use only steps whose verified verdict is GAP or ERROR; never point at a step marked VALID. If the only doubts are UNCLEAR steps, say in fails_why that this step is uncertain rather than wrong.
- fails_why: what goes wrong there (wrong assumption, missing case, not general enough, unjustified claim ...).
- fix_hints: exactly two levels for the MINIMAL change that makes the student's own way work: [direction (one sentence, no details), detail (concrete, but still let the student do the work)]. Empty list if nothing needs fixing.

VERIFIED STEP VERDICTS (after independent checking):
${verdicts}

Format:
{"approaches": [{"name": "", "approach_works": "yes|partly|no", "works_why": "", "fails_at": "s3", "fails_why": "", "fix_hints": ["<direction>", "<detail>"]}]}`;
  return {
    task: 'correct',
    model: models.fast,
    temperature: 0.2,
    messages: messages(COACH_SYSTEM, join(problemBlock(input.problem), stepsBlock(input.steps), instruction)),
    input,
  };
}

export function proposePrompt(input: ProposeRequest, models: Models): CompletionRequest {
  const instruction = `The student has finished working on the problem and now wants to learn other ways to approach it. Propose 2 to 4 alternative approaches that REALLY differ from the student's way (a different principle, not a rephrasing). Only ideas, no computation, no solution steps:
- one_liner: one sentence in the form "You could also ... instead of ..." relating it to the student's way.
- principle: the name of the principle (invariant, pigeonhole, extremal principle, induction, contraposition, generating functions, coloring, ...).
- principle_sentence: the general principle in one sentence, so the student recognizes it in the next problem.
Only propose approaches that you are confident lead to a complete solution.

Format:
{"ideas": [{"one_liner": "", "principle": "", "principle_sentence": ""}]}`;
  return {
    task: 'propose',
    model: models.fast,
    temperature: 0.5,
    messages: messages(COACH_SYSTEM, join(problemBlock(input.problem), stepsBlock(input.steps), instruction)),
    input,
  };
}

export interface SolveInput {
  problem: string;
  idea: Idea;
  /** Feedback from a failed verification, for one repair round. */
  repair?: { previous: Solution; issues: string };
}

export function solvePrompt(input: SolveInput, models: Models): CompletionRequest {
  const repair = input.repair
    ? `A previous attempt along this idea was rejected by an independent reviewer:\n${stepsBlock(
        input.repair.previous.steps.map((s) => ({ id: s.id, text: `${s.text} (because: ${s.justification})` })),
        'PREVIOUS ATTEMPT',
      )}\nREVIEWER'S OBJECTIONS: ${input.repair.issues}\nWrite a corrected complete solution that fixes these objections.`
    : '';
  const instruction = `The student explicitly opened a model solution for this approach, so here you write a COMPLETE solution, using exactly this idea:
- idea: ${input.idea.one_liner}
- principle: ${input.idea.principle}

Requirements:
- Numbered steps (ids "a1", "a2", ...). Each step has "text" (the claim or computation) and "justification" ("follows from a2 because ...", or "by the problem statement"). No jumps: if a step cannot be justified, the solution is not finished.
- Cover every case and every part of the problem; prove both directions where needed.
- final_answer: the final result in words/LaTeX (empty string for a pure proof problem), final_answer_normalized: a short canonical form for comparison (e.g. "n=3k" or "42"; empty for pure proofs).
- why_it_works: why this idea cracks the problem (2-3 sentences).
- when_to_try: which features of a problem suggest trying this idea (1-2 sentences).
- checks: claims of the solution that can be tested numerically (the final result on small cases, key lemmas; for geometry: random configurations), each with JavaScript code.
- figure_code / free_points: for a geometry problem, an interactive figure showing the construction this solution uses (auxiliary lines included); null and {} otherwise.

${CHECK_CODE_RULES}

${FIGURE_CODE_RULES}

Format:
{"steps": [{"id": "a1", "text": "", "justification": ""}], "final_answer": "", "final_answer_normalized": "", "why_it_works": "", "when_to_try": "", "checks": [{"claim": "", "code": "<function body>"}], "figure_code": null, "free_points": {}}`;
  return {
    task: 'solve',
    model: models.solver,
    temperature: 0.2,
    messages: messages(COACH_SYSTEM, join(problemBlock(input.problem), repair, instruction)),
    input,
  };
}

export interface VerifyInput {
  problem: string;
  solution: Solution;
}

export function verifyPrompt(input: VerifyInput, models: Models): CompletionRequest {
  const steps = input.solution.steps
    .map((s) => `[${s.id}] ${s.text}\n    justification: ${s.justification || '(none)'}`)
    .join('\n');
  const instruction = `Check the solution below step by step, as if grading at an olympiad:
- For each step: does it follow from the problem and the previous steps ("yes"/"no"/"unclear")? Are there hidden assumptions (unproved claims, missing cases, division by zero, only one direction shown ...)?
- overall: "valid" only if every step follows and the whole problem is solved; "flawed" if some step is wrong or a part of the problem is missing; "unclear" if you cannot decide.
- issues_summary: the concrete problems, or empty.
- checks: additional claims you want tested numerically (e.g. the final result for small cases), with code.

${CHECK_CODE_RULES}

SOLUTION TO CHECK:
${steps}
FINAL ANSWER: ${input.solution.final_answer || '(proof problem)'}

Format:
{"overall": "valid|flawed|unclear", "steps": [{"id": "a1", "follows": "yes|no|unclear", "hidden_assumptions": "", "comment": ""}], "issues_summary": "", "checks": [{"claim": "", "code": "<function body>"}]}`;
  return {
    task: 'verify',
    model: models.verifier,
    temperature: 0,
    messages: messages(REVIEWER_SYSTEM, join(problemBlock(input.problem), instruction)),
    input,
  };
}

export function challengePrompt(input: ChallengeRequest, models: Models): CompletionRequest {
  const step = input.solution.find((s) => s.id === input.stepId);
  const instruction = `A student doubts step [${input.stepId}] of the model solution below: "${input.concern.trim() || 'That is not right?'}"
Re-check this step from scratch, independently of whoever wrote it. Take the doubt seriously but decide on mathematical grounds only.
- verdict: "step_valid" if the step follows correctly (explain why, addressing the doubt), "step_flawed" if the step is wrong or unjustified (quote it and give concrete evidence), "unclear" if you cannot decide.
- If a numerically testable claim is involved, add check_code testing the step's claim, and check_claim in words.

${CHECK_CODE_RULES}

Format:
{"verdict": "step_valid|step_flawed|unclear", "explanation": "", "check_code": null, "check_claim": ""}`;
  return {
    task: 'challenge',
    model: models.verifier,
    temperature: 0,
    messages: messages(
      REVIEWER_SYSTEM,
      join(
        problemBlock(input.problem),
        stepsBlock(input.solution, 'MODEL SOLUTION'),
        step ? `STEP IN QUESTION: [${step.id}] ${step.text}` : '',
        instruction,
      ),
    ),
    input,
  };
}

