// Demo-mode provider: answers every task with scripted, schema-valid JSON so the whole
// app can be used and tested without an API key. It reads the structured `input`
// of each request instead of the prompt text.
import type {
  AskRequest,
  ChallengeRequest,
  ConjectureRequest,
  DiscussRequest,
  EvaluateRequest,
  RecognizeRequest,
  SolutionStep,
} from '../../../shared/api';
import type { Evaluation, FirstPassStep } from '../../../shared/schemas';
import type { RefuteInput } from '../../prompts/attempt';
import type { SolveInput, VerifyInput } from '../../prompts/coaching';
import type { CompletionRequest, CompletionResult, LLMProvider } from '../types';
import { CODE, DEMO_PROBLEM, DEMO_STEPS, IDEAS, OWN_VERSION_STEPS, SOLUTIONS } from './demo';

const squash = (s: string) => s.replace(/\s+/g, ' ').trim();
const demoIndex = (text: string) => DEMO_STEPS.findIndex((d) => squash(d) === squash(text));
/** Finds a scripted solution step; the client may append "(because: …)" to the text. */
const solutionStep = (text: string) =>
  SOLUTIONS.flatMap((s) => s.steps).find((s) => text && squash(text).startsWith(squash(s.text)));

const S = String.raw;

export class MockProvider implements LLMProvider {
  readonly name = 'mock' as const;

  constructor(private readonly latencyMs = 500) {}

  async complete(req: CompletionRequest): Promise<CompletionResult> {
    const slow = req.task === 'solve' || req.task === 'verify' || req.task === 'evaluate' ? 2 : 1;
    if (this.latencyMs > 0) await new Promise((r) => setTimeout(r, this.latencyMs * slow));
    return { text: JSON.stringify(this.answer(req)), usage: { promptTokens: 0, completionTokens: 0 } };
  }

  private answer(req: CompletionRequest): unknown {
    switch (req.task) {
      case 'transcribe':
        return { text: DEMO_PROBLEM, topic: 'number theory', uncertain: [] };
      case 'hint.1':
        return {
          explanation: S`Take the number 2 and multiply it by itself $n$ times; that gives $2^n$. Part (a): for which counting numbers $n$ does $2^n - 1$ land exactly on a multiple of 7? Part (b): show that $2^n + 1$ never lands on a multiple of 7, whatever $n$ you pick.`,
          glossary: [
            { term: 'positive integer', meaning: '1, 2, 3, … (whole numbers greater than 0).' },
            { term: 'divisible by 7', meaning: 'Can be split into 7 equal whole parts, i.e. it is 7 times a whole number (0, 7, 14, 21, …).' },
            { term: S`$2^n$`, meaning: S`The product of $n$ factors 2, e.g. $2^3 = 2 \cdot 2 \cdot 2 = 8$.` },
          ],
        };
      case 'hint.2':
        return {
          given: [S`$n$ is a positive integer ($n \ge 1$).`, S`The expressions $2^n - 1$ and $2^n + 1$.`],
          wanted: [S`(a) All $n$ with $7 \mid 2^n - 1$ – a complete list, with proof that no others work.`, S`(b) A proof that $7 \nmid 2^n + 1$ for every $n$.`],
          notes: S`"Find all" needs two directions: every $n$ you list works, and no other $n$ works.`,
        };
      case 'hint.3':
        return {
          intro: S`The first 15 powers of 2 and their remainders when divided by 7.`,
          code: CODE.table,
          what_to_look_for: 'In which rows is a remainder 0? Does anything repeat as n grows?',
        };
      case 'conjecture':
        return this.conjecture(req.input as ConjectureRequest);
      case 'hint.5':
        return {
          method: 'Modular arithmetic (working with remainders)',
          principle_sentence: 'When a question is about divisibility of fast-growing numbers, replace the numbers by their remainders – remainders stay small and often repeat.',
          why_here: S`Both parts only ask about divisibility by 7, so only the remainder of $2^n$ modulo 7 matters, not the huge number itself.`,
          self_question: S`If you know the remainder of $2^n$ modulo 7, how do you get the remainder of $2^{n+1}$?`,
        };
      case 'hint.6':
        return {
          parts: [
            { label: 'Key fact', purpose: 'A statement about the remainders of powers of 2 modulo 7 that holds for every n – with a proof, not just examples.' },
            { label: '(a) "if" direction', purpose: 'Show that every n of the form you claim really works.' },
            { label: '(a) "only if" direction', purpose: 'Show that no other n works.' },
            { label: '(b)', purpose: S`Use the key fact to show that $2^n + 1$ can never have remainder 0.` },
            { label: 'Conclusion', purpose: 'State the answer to (a) and the result of (b).' },
          ],
        };
      case 'recognize': {
        const input = req.input as RecognizeRequest;
        const steps = input.intendedIdea ? OWN_VERSION_STEPS : DEMO_STEPS;
        return { steps: steps.map((text) => ({ text, unclear: false })), unreadable: [] };
      }
      case 'evaluate':
        return this.evaluate(req.input as EvaluateRequest);
      case 'refute':
        return this.refute(req.input as RefuteInput);
      case 'discuss':
        return this.discuss(req.input as DiscussRequest);
      case 'ask':
        return this.ask(req.input as AskRequest);
      case 'correct':
        return this.correct(req.input as { steps: SolutionStep[] });
      case 'propose':
        return { ideas: IDEAS };
      case 'solve':
        return SOLUTIONS[ideaIndex((req.input as SolveInput).idea.principle)];
      case 'verify':
        return this.verify(req.input as VerifyInput);
      case 'challenge':
        return this.challenge(req.input as ChallengeRequest);
    }
  }

  private conjecture(input: ConjectureRequest) {
    const c = input.conjecture.toLowerCase();
    if (/\b3\b|three|3k|third/.test(c)) {
      return {
        verdict: 'consistent',
        feedback: S`That matches the table: the remainder of $2^n - 1$ is 0 exactly in the rows $n = 3, 6, 9, 12, 15$. Now the real work is to prove that it stays like this for every $n$.`,
        nudge: S`Why should the pattern continue beyond the table? What happens to the remainder when you go from $2^n$ to $2^{n+3}$?`,
        check_code: CODE.multiplesOf3,
        check_claim: '7 divides 2^n - 1 exactly when 3 divides n',
      };
    }
    if (/even|odd/.test(c)) {
      return {
        verdict: 'inconsistent',
        feedback: S`Look at the row $n = 2$: $2^2 - 1 = 3$, which is not divisible by 7, although 2 is even. Parity does not seem to be what matters.`,
        nudge: 'In which rows exactly is the remainder of 2^n - 1 equal to 0?',
        check_code: null,
        check_claim: '',
      };
    }
    return {
      verdict: 'unclear',
      feedback: 'I am not sure I understand the pattern you mean. Can you state it as a rule, like "7 divides 2^n - 1 exactly when n is …"?',
      nudge: 'Look at the column (2^n - 1) mod 7: where are the zeros?',
      check_code: null,
      check_claim: '',
    };
  }

  private evaluate(input: EvaluateRequest): Evaluation {
    if (input.intendedIdea) {
      return {
        steps: input.steps.map((s, i) => ({
          step: s.id,
          status: 'valid',
          quote: '',
          reason: i === 0 ? 'Division with remainder by 3.' : `Follows from ${input.steps[i - 1].id}.`,
          evidence: '',
          deduction: 0,
          check_code: null,
          check_claim: '',
        })),
        score: 7,
        summary: 'Complete and clean: every case is covered and each step is justified.',
        idea_used: 'yes',
        idea_comment: S`You reduced the exponent with $2^3 \equiv 1 \pmod 7$ – exactly the idea of this approach.`,
      };
    }
    const steps = input.steps.map((s): FirstPassStep => {
      const scripted = SCRIPTED_VERDICTS[demoIndex(s.text)];
      return scripted
        ? { ...scripted, step: s.id }
        : {
            step: s.id,
            status: 'valid',
            quote: '',
            reason: 'Follows from the previous steps. (Demo mode: unscripted step.)',
            evidence: '',
            deduction: 0,
            check_code: null,
            check_claim: '',
          };
    });
    const deductions = steps.reduce((sum, s) => sum + s.deduction, 0);
    return {
      steps,
      score: Math.max(0, 7 - deductions),
      summary: 'Part (a) is essentially right – one step needs a reason. Part (b) uses an argument that does not work yet.',
      idea_comment: '',
    };
  }

  private refute(input: RefuteInput) {
    if (/exactly when/.test(input.critique.quote)) {
      return {
        upheld: false,
        reasoning: S`The critique is not convincing: the previous step lists the remainders as $2, 4, 1$ repeating, so the remainder 1 appears only at $n = 3, 6, 9, \dots$. Given that step, both directions of "exactly when" follow.`,
      };
    }
    return {
      upheld: true,
      reasoning:
        input.critique.status === 'error'
          ? S`I could not defend the step: $21 = 3 \cdot 7$ is odd and divisible by 7, so the quoted claim is false.`
          : S`I could not defend the step: the remainders are only listed for a few values of $n$, and no reason is given why the pattern continues for all $n$.`,
    };
  }

  private discuss(input: DiscussRequest) {
    const userTurns = input.history.filter((t) => t.role === 'user');
    const last = input.history[input.history.length - 1];
    const lastUser = (userTurns[userTurns.length - 1]?.text ?? '').toLowerCase();
    const quote = input.critique.quote;

    if (last?.role === 'check') {
      return {
        reply: S`The test settles it: ${last.text} So the claim in step ${input.stepId} does not hold in general. Your goal in (b) is still reachable – just not via parity.`,
        outcome: 'maintain',
        open_point: '',
        check_code: null,
        check_claim: '',
      };
    }
    if (/exactly when/.test(quote)) {
      return {
        reply: S`You are right. Your list in the previous step says the remainders are $2, 4, 1$ repeating, so the remainder 1 appears only at $n = 3, 6, 9, \dots$ – that covers the "only if" direction too. I had overlooked that. Step ${input.stepId} is valid, given the previous step.`,
        outcome: 'agree_valid',
        open_point: '',
        check_code: null,
        check_claim: '',
      };
    }
    if (/odd number/.test(quote)) {
      return {
        reply: S`I read step ${input.stepId} as: "no odd number is divisible by 7". The problem I see: $21$ is odd and $21 = 3 \cdot 7$. Let's test the claim on more numbers.`,
        outcome: 'maintain',
        open_point: '',
        check_code: CODE.oddMultiples,
        check_claim: 'No odd number is divisible by 7',
      };
    }
    if (/period/.test(quote)) {
      if (/2\^\{?n\s*\+\s*3|8|multipl|times|next/.test(lastUser) && userTurns.length > 0) {
        return {
          reply: S`Yes – that is exactly the missing reason: $2^{n+3} = 8 \cdot 2^n \equiv 2^n \pmod 7$, so each remainder comes back three steps later. With that sentence added, the step is complete.`,
          outcome: 'agree_valid',
          open_point: '',
          check_code: null,
          check_claim: '',
        };
      }
      if (userTurns.length <= 1) {
        return {
          reply: S`Good point to discuss. Do you mean that you checked the first values, or do you have a reason why the pattern $2, 4, 1$ continues for every $n$? The numbers in the table do repeat – my concern is only that the step does not say why.`,
          outcome: 'clarify',
          open_point: '',
          check_code: CODE.period,
          check_claim: 'The remainders of 2^n mod 7 follow the pattern 2, 4, 1 for all n',
        };
      }
      return {
        reply: 'The pattern is true (the code test confirms it for thousands of values), but a test is not a proof. Let us leave it as an open point.',
        outcome: 'open',
        open_point: S`Show that the pattern continues for every $n$, e.g. by relating $2^{n+3}$ to $2^n$ modulo 7.`,
        check_code: null,
        check_claim: '',
      };
    }
    return {
      reply: 'Thanks for explaining. Can you say in one sentence which earlier step or fact your step follows from?',
      outcome: 'clarify',
      open_point: '',
      check_code: null,
      check_claim: '',
    };
  }

  private ask(input: AskRequest) {
    const q = input.question.trim();
    const explain = !q || /^explain this/i.test(q);
    if (input.context.kind === 'image') {
      return {
        answer: explain
          ? S`(Demo mode can't look at your marking, so this is a sample answer.) In this part you work with the remainders of $2^n$ modulo 7. The important question is whether the list continues the same way forever – what happens to the remainder when you go from $2^n$ to $2^{n+3}$?`
          : S`(Demo mode sample answer to "${q}".) Look at the marked lines: which earlier step or fact does each claim there follow from? If you can name it, the step is justified; if not, that is where to add a sentence.`,
      };
    }
    const marked = input.context.marked[0];
    const justification = solutionStep(marked?.text ?? '')?.justification;
    return {
      answer: justification
        ? S`Step ${marked.id}: ${justification} ${explain ? '' : S`About your question "${q}": the step only uses what is stated in the earlier steps, nothing else.`}`.trim()
        : `This step summarizes the previous ones. (Demo mode sample answer.)`,
    };
  }

  private correct(input: { steps: SolutionStep[] }) {
    const idOf = (i: number) => input.steps.find((s) => demoIndex(s.text) === i)?.id ?? null;
    return {
      approaches: [
        {
          name: 'Part (a): remainders of 2^n modulo 7',
          approach_works: 'partly',
          works_why: 'Looking at remainders is a complete method for (a); only the claim that they repeat needs a reason.',
          fails_at: idOf(1),
          fails_why: 'The repetition is read off from a few values; nothing guarantees that it continues for every n.',
          fix_hints: [
            'Add one sentence explaining why the remainders must repeat.',
            S`Compare $2^{n+3}$ with $2^n$: what is $2^3$ modulo 7, and what does that mean for the remainder three steps later?`,
          ],
        },
        {
          name: 'Part (b): parity argument',
          approach_works: 'no',
          works_why: 'Being odd says nothing about divisibility by 7, so this argument cannot be repaired as it is.',
          fails_at: idOf(4),
          fails_why: S`The claim "an odd number cannot be divisible by 7" is false, e.g. $21 = 3 \cdot 7$.`,
          fix_hints: [
            'You already have everything you need from part (a) – reuse your remainder list.',
            S`By your step on the remainders, $2^n \bmod 7$ is always 2, 4 or 1. Which remainder would $2^n$ need for $7 \mid 2^n + 1$ (your step (b))? Can it ever take that value?`,
          ],
        },
      ],
    };
  }

  private verify(input: VerifyInput) {
    const i = SOLUTIONS.findIndex((s) => s.final_answer === input.solution.final_answer && s.steps.length === input.solution.steps.length);
    return {
      overall: 'valid',
      steps: input.solution.steps.map((s) => ({ id: s.id, follows: 'yes', hidden_assumptions: '', comment: '' })),
      issues_summary: '',
      checks: i === 0 ? [{ claim: S`2^3 leaves remainder 1 modulo 7`, code: CODE.eightIsOne }] : [],
    };
  }

  private challenge(input: ChallengeRequest) {
    const step = input.solution.find((s) => s.id === input.stepId);
    const justification = solutionStep(step?.text ?? '')?.justification;
    const usesEight = /2\^3|8/.test(step?.text ?? '');
    return {
      verdict: 'step_valid',
      explanation: `I re-checked step ${input.stepId} from scratch. ${justification ?? 'It follows from the previous steps.'} Your doubt is reasonable to check, but the step holds.`,
      check_code: usesEight ? CODE.eightIsOne : null,
      check_claim: usesEight ? '2^3 leaves remainder 1 modulo 7' : '',
    };
  }
}

function ideaIndex(principle: string): number {
  const i = IDEAS.findIndex((idea) => idea.principle === principle);
  return i >= 0 ? i : 0;
}

const SCRIPTED_VERDICTS: Record<number, Omit<FirstPassStep, 'step'>> = {
  0: { status: 'valid', quote: '', reason: 'Direct computation, correct.', evidence: '', deduction: 0, check_code: null, check_claim: '' },
  1: {
    status: 'gap',
    quote: 'repeat with period 3',
    reason: 'The repetition is read off from the first three values; the step does not say why it continues for every n.',
    evidence: S`The inference from $n = 1, 2, 3$ to all $n$ is not justified. A reason such as $2^{n+3} = 8 \cdot 2^n \equiv 2^n \pmod 7$ is missing.`,
    deduction: 1,
    check_code: CODE.period,
    check_claim: 'The remainders of 2^n mod 7 follow the pattern 2, 4, 1 for all n',
  },
  2: {
    status: 'error',
    quote: 'exactly when',
    reason: S`Only "multiple of 3 $\Rightarrow$ $7 \mid 2^n - 1$" is argued; the converse direction is not shown.`,
    evidence: 'The step claims an equivalence but gives no argument that other n fail.',
    deduction: 1,
    check_code: null,
    check_claim: '',
  },
  3: { status: 'valid', quote: '', reason: S`Correct: $2^n + 1 \equiv 0 \iff 2^n \equiv -1 \equiv 6 \pmod 7$.`, evidence: '', deduction: 0, check_code: null, check_claim: '' },
  4: {
    status: 'error',
    quote: 'an odd number cannot be divisible by 7',
    reason: 'This claim is false, so it cannot rule out divisibility by 7.',
    evidence: S`$21 = 3 \cdot 7$ is odd and divisible by 7.`,
    deduction: 2,
    check_code: CODE.oddMultiples,
    check_claim: 'No odd number is divisible by 7',
  },
  5: { status: 'valid', quote: '', reason: 'Follows from the two previous steps (but see the problem in the step before).', evidence: '', deduction: 0, check_code: null, check_claim: '' },
};
