// Demo script: IMO 1964, Problem 1, with a typical student solution that contains a
// gap, a disputed step and a real error. Designed to exercise every verification path
// (confirmed critique, critique withdrawn after refutation, code counterexample,
// logic-only alternative, discarded alternative).
import type { FirstPassStep, Solution } from '../../../../shared/schemas';
import { S, noCheck, type DemoScript } from './types';

export const DEMO_PROBLEM = String.raw`(a) Find all positive integers $n$ for which $2^n - 1$ is divisible by $7$.
(b) Prove that there is no positive integer $n$ for which $2^n + 1$ is divisible by $7$.`;

export const DEMO_STEPS = [
  String.raw`$2^1 = 2,\ 2^2 = 4,\ 2^3 = 8 \equiv 1 \pmod 7$.`,
  String.raw`So the remainders of $2^n$ modulo 7 repeat with period 3: $2, 4, 1, 2, 4, 1, \dots$`,
  String.raw`Hence $7 \mid 2^n - 1$ exactly when $n$ is a multiple of 3. Answer (a): $n = 3k$.`,
  String.raw`(b) $7 \mid 2^n + 1$ would mean $2^n \equiv 6 \pmod 7$.`,
  String.raw`But $2^n + 1$ is always odd, and an odd number cannot be divisible by 7.`,
  String.raw`So there is no such $n$.`,
];

export const OWN_VERSION_STEPS = [
  String.raw`Let $n = 3q + r$ with $r \in \{0, 1, 2\}$.`,
  String.raw`$2^3 = 8 \equiv 1 \pmod 7$, so $2^n = 8^q \cdot 2^r \equiv 2^r \pmod 7$.`,
  String.raw`$2^r \in \{1, 2, 4\}$, and it equals 1 only for $r = 0$. So (a): $7 \mid 2^n - 1 \iff 3 \mid n$.`,
  String.raw`(b) $2^n + 1 \equiv 2^r + 1 \in \{2, 3, 5\} \pmod 7$, never $0$. So no $n$ works.`,
];

export const CODE = {
  table: `const rows = [];
let p = 1n;
for (let n = 1; n <= 15; n++) {
  p *= 2n;
  rows.push([n, p.toString(), Number(p % 7n), Number((p - 1n) % 7n), Number((p + 1n) % 7n)]);
}
return { columns: ['n', '2^n', '2^n mod 7', '(2^n - 1) mod 7', '(2^n + 1) mod 7'], rows };`,

  period: `let r = 1;
const pattern = [2, 4, 1];
for (let n = 1; n <= 3000; n++) {
  r = (r * 2) % 7;
  if (r !== pattern[(n - 1) % 3]) return { holds: false, detail: 'n = ' + n + ' gives remainder ' + r };
}
return { holds: true, detail: 'The remainders follow 2, 4, 1 for n = 1 ... 3000.' };`,

  oddMultiples: `for (let m = 1; m < 1000; m += 2) {
  if (m % 7 === 0) return { holds: false, detail: m + ' is odd and divisible by 7.' };
}
return { holds: true, detail: 'No odd multiple of 7 below 1000.' };`,

  multiplesOf3: `let r = 1;
for (let n = 1; n <= 5000; n++) {
  r = (r * 2) % 7;
  if ((r === 1) !== (n % 3 === 0)) return { holds: false, detail: 'Fails at n = ' + n };
}
return { holds: true, detail: 'Checked n = 1 ... 5000: 7 divides 2^n - 1 exactly when 3 divides n.' };`,

  neverPlusOne: `let r = 1;
for (let n = 1; n <= 5000; n++) {
  r = (r * 2) % 7;
  if ((r + 1) % 7 === 0) return { holds: false, detail: '7 divides 2^n + 1 for n = ' + n };
}
return { holds: true, detail: 'No n <= 5000 with 7 | 2^n + 1.' };`,

  eightIsOne: `return { holds: 8 % 7 === 1, detail: '8 = 7 + 1, so 2^3 leaves remainder ' + (8 % 7) + ' modulo 7.' };`,

  multiplesOf6: `let r = 1;
for (let n = 1; n <= 600; n++) {
  r = (r * 2) % 7;
  if ((r === 1) !== (n % 6 === 0)) {
    return { holds: false, detail: 'n = ' + n + ': ' + (r === 1 ? '7 divides 2^n - 1, but n is not a multiple of 6' : 'n is a multiple of 6, but 7 does not divide 2^n - 1') };
  }
}
return { holds: true, detail: 'Holds for n <= 600.' };`,
};

export const IDEAS = [
  {
    one_liner: String.raw`Instead of listing remainders, you could write $n = 3q + r$ and use $2^3 = 8 \equiv 1 \pmod 7$ to cut the exponent down to $r$.`,
    principle: 'Reducing exponents (order modulo m)',
    principle_sentence: String.raw`If $a^k \equiv 1 \pmod m$, then $a^n \bmod m$ depends only on the remainder of $n$ modulo $k$.`,
  },
  {
    one_liner: String.raw`Instead of trusting a pattern, you could prove $7 \mid 2^{3q} - 1$ by induction on $q$ and then treat $n = 3q + 1$ and $3q + 2$ separately.`,
    principle: 'Induction',
    principle_sentence: 'To prove a statement for every natural number, prove it for the first one and show that each case implies the next.',
  },
  {
    one_liner: String.raw`Instead of computing remainders, you could factor $2^n - 1$ as a difference of powers.`,
    principle: 'Algebraic factorization',
    principle_sentence: String.raw`$a - b$ always divides $a^k - b^k$, which turns divisibility questions about powers into identities.`,
  },
];

export const SOLUTIONS: Solution[] = [
  {
    steps: [
      { id: 'a1', text: String.raw`Write $n = 3q + r$ with integers $q \ge 0$ and $r \in \{0, 1, 2\}$.`, justification: 'Division with remainder by 3.' },
      { id: 'a2', text: String.raw`$2^3 = 8 = 7 + 1$, so $2^3 \equiv 1 \pmod 7$.`, justification: 'Direct computation.' },
      {
        id: 'a3',
        text: String.raw`Hence $2^n = (2^3)^q \cdot 2^r \equiv 1^q \cdot 2^r = 2^r \pmod 7$.`,
        justification: 'Follows from a1 and a2, because congruences may be multiplied and raised to powers.',
      },
      {
        id: 'a4',
        text: String.raw`So $2^n \bmod 7$ equals $1, 2, 4$ for $r = 0, 1, 2$ respectively.`,
        justification: String.raw`Evaluate $2^r$ for $r = 0, 1, 2$ in a3; all three values are smaller than 7.`,
      },
      {
        id: 'a5',
        text: String.raw`(a) $7 \mid 2^n - 1 \iff 2^n \equiv 1 \pmod 7 \iff r = 0 \iff 3 \mid n$.`,
        justification: 'By a4 the remainder 1 occurs for r = 0 and only then, which gives both directions.',
      },
      {
        id: 'a6',
        text: String.raw`(b) $7 \mid 2^n + 1 \iff 2^n \equiv 6 \pmod 7$, but by a4 the remainder of $2^n$ is always $1$, $2$ or $4$, never $6$. So no such $n$ exists.`,
        justification: 'From a4.',
      },
    ],
    final_answer: String.raw`(a) exactly the multiples of 3, $n = 3k$; (b) no $n$.`,
    final_answer_normalized: 'n=3k',
    why_it_works: String.raw`Once $2^3 \equiv 1$, the exponent only matters modulo 3, so infinitely many cases collapse into three cases that can be checked by hand.`,
    when_to_try: String.raw`Whenever powers $a^n$ appear modulo a fixed number $m$: look for a small exponent $k$ with $a^k \equiv 1 \pmod m$.`,
    checks: [
      { claim: '7 divides 2^n - 1 exactly when 3 divides n', code: CODE.multiplesOf3 },
      { claim: '2^n + 1 is never divisible by 7', code: CODE.neverPlusOne },
    ],
    figure_code: null,
    free_points: {},
  },
  {
    steps: [
      { id: 'a1', text: String.raw`Claim: $7 \mid 2^{3q} - 1$ for all integers $q \ge 0$.`, justification: 'We prove this by induction on q.' },
      { id: 'a2', text: String.raw`Base case $q = 0$: $2^0 - 1 = 0$ is divisible by 7.`, justification: '0 = 7 · 0.' },
      {
        id: 'a3',
        text: String.raw`$2^{3(q+1)} - 1 = 8 \cdot 2^{3q} - 1 = 8\,(2^{3q} - 1) + 7$.`,
        justification: String.raw`Algebra: $8 \cdot 2^{3q} - 1 = 8 \cdot 2^{3q} - 8 + 7$.`,
      },
      {
        id: 'a4',
        text: String.raw`If $7 \mid 2^{3q} - 1$, both summands in a3 are divisible by 7, so $7 \mid 2^{3(q+1)} - 1$. This proves the claim.`,
        justification: 'Induction hypothesis together with a3; base case a2.',
      },
      {
        id: 'a5',
        text: String.raw`For $n = 3q + 1$: $2^n - 1 = 2\,(2^{3q} - 1) + 1$, remainder 1. For $n = 3q + 2$: $2^n - 1 = 4\,(2^{3q} - 1) + 3$, remainder 3.`,
        justification: String.raw`By a4, $2^{3q} - 1$ is a multiple of 7.`,
      },
      {
        id: 'a6',
        text: String.raw`(a) Therefore $7 \mid 2^n - 1$ exactly when $n = 3q$.`,
        justification: 'a4 and a5 cover all three residues of n modulo 3.',
      },
      {
        id: 'a7',
        text: String.raw`(b) $2^n + 1 = (2^n - 1) + 2$ leaves remainder $2, 3, 5$ for $n = 3q, 3q + 1, 3q + 2$, never $0$.`,
        justification: 'Add 2 to the remainders found in a4 and a5.',
      },
    ],
    final_answer: String.raw`(a) $n = 3k$; (b) no $n$.`,
    final_answer_normalized: 'n=3k',
    why_it_works: 'The step from q to q + 1 multiplies by 8, which is 1 more than a multiple of 7, so divisibility is passed on.',
    when_to_try: 'When a statement about all n can be reduced to how one case grows into the next, e.g. powers or recursive sequences.',
    checks: [],
    figure_code: null,
    free_points: {},
  },
  {
    steps: [
      {
        id: 'a1',
        text: String.raw`If $n = 6k$, then $2^n - 1 = 64^k - 1$, and $64 - 1 = 63 = 7 \cdot 9$ divides $64^k - 1$.`,
        justification: String.raw`$a - b \mid a^k - b^k$.`,
      },
      {
        id: 'a2',
        text: String.raw`If $6 \nmid n$, then $2^n - 1$ has no factor of the form $64^j - 1$, so it is not divisible by 7.`,
        justification: 'By a1.',
      },
      { id: 'a3', text: String.raw`(a) Answer: $n = 6k$.`, justification: 'a1 and a2.' },
    ],
    final_answer: String.raw`$n = 6k$`,
    final_answer_normalized: 'n=6k',
    why_it_works: 'Factoring turns divisibility of a power into divisibility of a simpler factor.',
    when_to_try: String.raw`When expressions of the form $a^n - 1$ or $a^n - b^n$ appear.`,
    checks: [{ claim: '7 divides 2^n - 1 exactly when n is a multiple of 6', code: CODE.multiplesOf6 }],
    figure_code: null,
    free_points: {},
  },
];

const VERDICTS: Record<number, Omit<FirstPassStep, 'step'>> = {
  0: { status: 'valid', quote: '', reason: 'Direct computation, correct.', evidence: '', deduction: 0, ...noCheck },
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
    ...noCheck,
  },
  3: { status: 'valid', quote: '', reason: S`Correct: $2^n + 1 \equiv 0 \iff 2^n \equiv -1 \equiv 6 \pmod 7$.`, evidence: '', deduction: 0, ...noCheck },
  4: {
    status: 'error',
    quote: 'an odd number cannot be divisible by 7',
    reason: 'This claim is false, so it cannot rule out divisibility by 7.',
    evidence: S`$21 = 3 \cdot 7$ is odd and divisible by 7.`,
    deduction: 2,
    check_code: CODE.oddMultiples,
    check_claim: 'No odd number is divisible by 7',
  },
  5: { status: 'valid', quote: '', reason: 'Follows from the two previous steps (but see the problem in the step before).', evidence: '', deduction: 0, ...noCheck },
};

export const numberTheory: DemoScript = {
  id: 'number-theory',
  matches: (problem) => /2\^n/.test(problem),
  transcription: { text: DEMO_PROBLEM, topic: 'number theory', figure: '', uncertain: [] },
  hints: {
    1: {
      explanation: S`Take the number 2 and multiply it by itself $n$ times; that gives $2^n$. Part (a): for which counting numbers $n$ does $2^n - 1$ land exactly on a multiple of 7? Part (b): show that $2^n + 1$ never lands on a multiple of 7, whatever $n$ you pick.`,
      glossary: [
        { term: 'positive integer', meaning: '1, 2, 3, … (whole numbers greater than 0).' },
        { term: 'divisible by 7', meaning: 'Can be split into 7 equal whole parts, i.e. it is 7 times a whole number (0, 7, 14, 21, …).' },
        { term: S`$2^n$`, meaning: S`The product of $n$ factors 2, e.g. $2^3 = 2 \cdot 2 \cdot 2 = 8$.` },
      ],
    },
    2: {
      given: [S`$n$ is a positive integer ($n \ge 1$).`, S`The expressions $2^n - 1$ and $2^n + 1$.`],
      wanted: [S`(a) All $n$ with $7 \mid 2^n - 1$ – a complete list, with proof that no others work.`, S`(b) A proof that $7 \nmid 2^n + 1$ for every $n$.`],
      notes: S`"Find all" needs two directions: every $n$ you list works, and no other $n$ works.`,
    },
    3: {
      kind: 'table',
      intro: 'The first 15 powers of 2 and their remainders when divided by 7.',
      code: CODE.table,
      free_points: {},
      what_to_look_for: 'In which rows is a remainder 0? Does anything repeat as n grows?',
    },
    5: {
      method: 'Modular arithmetic (working with remainders)',
      principle_sentence: 'When a question is about divisibility of fast-growing numbers, replace the numbers by their remainders – remainders stay small and often repeat.',
      why_here: S`Both parts only ask about divisibility by 7, so only the remainder of $2^n$ modulo 7 matters, not the huge number itself.`,
      self_question: S`If you know the remainder of $2^n$ modulo 7, how do you get the remainder of $2^{n+1}$?`,
    },
    6: {
      parts: [
        { label: 'Key fact', purpose: 'A statement about the remainders of powers of 2 modulo 7 that holds for every n – with a proof, not just examples.' },
        { label: '(a) "if" direction', purpose: 'Show that every n of the form you claim really works.' },
        { label: '(a) "only if" direction', purpose: 'Show that no other n works.' },
        { label: '(b)', purpose: S`Use the key fact to show that $2^n + 1$ can never have remainder 0.` },
        { label: 'Conclusion', purpose: 'State the answer to (a) and the result of (b).' },
      ],
    },
  },
  conjecture(input) {
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
        ...noCheck,
      };
    }
    return {
      verdict: 'unclear',
      feedback: 'I am not sure I understand the pattern you mean. Can you state it as a rule, like "7 divides 2^n - 1 exactly when n is …"?',
      nudge: 'Look at the column (2^n - 1) mod 7: where are the zeros?',
      ...noCheck,
    };
  },
  steps: DEMO_STEPS,
  ownVersionSteps: OWN_VERSION_STEPS,
  verdicts: VERDICTS,
  summary: 'Part (a) is essentially right – one step needs a reason. Part (b) uses an argument that does not work yet.',
  ownVersionComment: S`You reduced the exponent with $2^3 \equiv 1 \pmod 7$ – exactly the idea of this approach.`,
  refute(input) {
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
  },
  discuss(input) {
    const userTurns = input.history.filter((t) => t.role === 'user');
    const last = input.history[input.history.length - 1];
    const lastUser = (userTurns[userTurns.length - 1]?.text ?? '').toLowerCase();
    const quote = input.critique.quote;
    if (last?.role === 'check') {
      return {
        reply: S`The test settles it: ${last.text} So the claim in step ${input.stepId} does not hold in general. Your goal in (b) is still reachable – just not via parity.`,
        outcome: 'maintain',
        open_point: '',
        ...noCheck,
      };
    }
    if (/exactly when/.test(quote)) {
      return {
        reply: S`You are right. Your list in the previous step says the remainders are $2, 4, 1$ repeating, so the remainder 1 appears only at $n = 3, 6, 9, \dots$ – that covers the "only if" direction too. I had overlooked that. Step ${input.stepId} is valid, given the previous step.`,
        outcome: 'agree_valid',
        open_point: '',
        ...noCheck,
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
          ...noCheck,
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
        ...noCheck,
      };
    }
    return {
      reply: 'Thanks for explaining. Can you say in one sentence which earlier step or fact your step follows from?',
      outcome: 'clarify',
      open_point: '',
      ...noCheck,
    };
  },
  askImage: (q, explain) =>
    explain
      ? S`(Demo mode can't look at your marking, so this is a sample answer.) In this part you work with the remainders of $2^n$ modulo 7. The important question is whether the list continues the same way forever – what happens to the remainder when you go from $2^n$ to $2^{n+3}$?`
      : S`(Demo mode sample answer to "${q}".) Look at the marked lines: which earlier step or fact does each claim there follow from? If you can name it, the step is justified; if not, that is where to add a sentence.`,
  correct: (stepId) => ({
    approaches: [
      {
        name: 'Part (a): remainders of 2^n modulo 7',
        approach_works: 'partly',
        works_why: 'Looking at remainders is a complete method for (a); only the claim that they repeat needs a reason.',
        fails_at: stepId(1),
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
        fails_at: stepId(4),
        fails_why: S`The claim "an odd number cannot be divisible by 7" is false, e.g. $21 = 3 \cdot 7$.`,
        fix_hints: [
          'You already have everything you need from part (a) – reuse your remainder list.',
          S`By your step on the remainders, $2^n \bmod 7$ is always 2, 4 or 1. Which remainder would $2^n$ need for $7 \mid 2^n + 1$ (your step (b))? Can it ever take that value?`,
        ],
      },
    ],
  }),
  ideas: IDEAS,
  solutions: SOLUTIONS,
  verifierChecks: { 0: [{ claim: '2^3 leaves remainder 1 modulo 7', code: CODE.eightIsOne }] },
  challengeCheck: (text) => (/2\^3|8/.test(text) ? { claim: '2^3 leaves remainder 1 modulo 7', code: CODE.eightIsOne } : null),
};
