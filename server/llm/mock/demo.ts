// Scripted content for demo mode: IMO 1964, Problem 1, with a typical student
// solution that contains a gap, a disputed step and a real error. The scripts are
// designed to exercise every verification path (confirmed critique, critique withdrawn
// after refutation, code counterexample, logic-only alternative, discarded alternative).
import type { Solution } from '../../../shared/schemas';

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
  },
];
