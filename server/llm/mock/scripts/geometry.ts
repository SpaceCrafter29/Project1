// Demo script: the midpoint quadrilateral (Varignon) with an area part. Shows how the
// coach handles geometry: an interactive figure instead of a small-case table, and
// claims tested on thousands of random quadrilaterals instead of small n.
import type { FirstPassStep, Solution } from '../../../../shared/schemas';
import { S, noCheck, type DemoScript } from './types';

export const GEOMETRY_PROBLEM = S`Let $ABCD$ be a convex quadrilateral, and let $M$, $N$, $P$, $Q$ be the midpoints of the sides $AB$, $BC$, $CD$, $DA$.
(a) Prove that $MNPQ$ is a parallelogram.
(b) Prove that the area of $MNPQ$ is half the area of $ABCD$.`;

export const GEOMETRY_STEPS = [
  S`Draw the diagonal $AC$.`,
  S`In triangle $ABC$, $MN$ is a midline, so $MN \parallel AC$ and $MN = \tfrac12 AC$.`,
  S`In triangle $ACD$, $QP$ is a midline, so $QP \parallel AC$ and $QP = \tfrac12 AC$.`,
  S`So $MN \parallel QP$ and $MN = QP$, hence $MNPQ$ is a parallelogram.`,
  S`(b) The area of $MNPQ$ is $MN \cdot NP$.`,
  S`$MN \cdot NP = \tfrac12 AC \cdot \tfrac12 BD = \tfrac14 AC \cdot BD$, and the area of $ABCD$ is $\tfrac12 AC \cdot BD$, so $[MNPQ] = \tfrac12 [ABCD]$.`,
];

const OWN_VERSION_STEPS = [
  S`Let $M = \tfrac{A+B}{2}$, $N = \tfrac{B+C}{2}$, $P = \tfrac{C+D}{2}$, $Q = \tfrac{D+A}{2}$ (points as vectors).`,
  S`Then $N - M = \tfrac{C-A}{2} = P - Q$, so $\vec{MN} = \vec{QP}$ and $MNPQ$ is a parallelogram.`,
  S`Also $Q - M = \tfrac{D-B}{2}$, so $[MNPQ] = |(N-M) \times (Q-M)| = \tfrac14 |(C-A) \times (D-B)|$.`,
  S`$[ABCD] = \tfrac12 |(C-A) \times (D-B)|$, hence $[MNPQ] = \tfrac12 [ABCD]$.`,
];

const POINT = `const f = (p) => '(' + p[0].toFixed(1) + ', ' + p[1].toFixed(1) + ')';`;

export const GEO_CODE = {
  figure: `const { A, B, C, D } = free;
const M = geo.mid(A, B), N = geo.mid(B, C), P = geo.mid(C, D), Q = geo.mid(D, A);
return {
  points: { A, B, C, D, M, N, P, Q },
  polygons: [{ points: ['A', 'B', 'C', 'D'] }, { points: ['M', 'N', 'P', 'Q'], fill: true }],
  measures: [
    { label: 'MN', value: geo.dist(M, N) },
    { label: 'PQ', value: geo.dist(P, Q) },
    { label: 'NP', value: geo.dist(N, P) },
    { label: 'QM', value: geo.dist(Q, M) },
    { label: 'area MNPQ', value: geo.area(M, N, P, Q) },
    { label: 'area ABCD', value: geo.area(A, B, C, D) },
  ],
};`,

  vectorFigure: `const { A, B, C, D } = free;
const M = geo.mid(A, B), N = geo.mid(B, C), P = geo.mid(C, D), Q = geo.mid(D, A);
const v = (p) => p[0].toFixed(2) + ', ' + p[1].toFixed(2);
return {
  points: { A, B, C, D, M, N, P, Q },
  polygons: [{ points: ['A', 'B', 'C', 'D'] }, { points: ['M', 'N', 'P', 'Q'], fill: true }],
  segments: [['A', 'C'], ['B', 'D']],
  measures: [
    { label: 'N − M', value: v(geo.sub(N, M)) },
    { label: 'P − Q', value: v(geo.sub(P, Q)) },
    { label: '(C − A) / 2', value: v(geo.scale(geo.sub(C, A), 0.5)) },
    { label: 'area MNPQ / area ABCD', value: geo.area(M, N, P, Q) / geo.area(A, B, C, D) },
  ],
};`,

  areaHalf: `for (let i = 0; i < 2000; i++) {
  const [A, B, C, D] = geo.randConvexQuad();
  const M = geo.mid(A, B), N = geo.mid(B, C), P = geo.mid(C, D), Q = geo.mid(D, A);
  if (!geo.approx(geo.area(M, N, P, Q), geo.area(A, B, C, D) / 2)) return { holds: false, detail: 'Fails for A = ' + A };
}
return { holds: true, detail: 'Holds for 2000 random convex quadrilaterals.' };`,

  parallelSides: `for (let i = 0; i < 2000; i++) {
  const [A, B, C, D] = geo.randConvexQuad();
  const M = geo.mid(A, B), N = geo.mid(B, C), P = geo.mid(C, D), Q = geo.mid(D, A);
  if (!geo.parallel(M, N, Q, P) || !geo.parallel(N, P, M, Q)) return { holds: false, detail: 'Fails for A = ' + A };
}
return { holds: true, detail: 'Both pairs of opposite sides are parallel in 2000 random convex quadrilaterals.' };`,

  vectorsEqual: `for (let i = 0; i < 2000; i++) {
  const [A, B, C, D] = geo.randConvexQuad();
  const M = geo.mid(A, B), N = geo.mid(B, C), P = geo.mid(C, D), Q = geo.mid(D, A);
  const u = geo.sub(N, M), w = geo.sub(P, Q), h = geo.scale(geo.sub(C, A), 0.5);
  if (!geo.approx(u[0], w[0]) || !geo.approx(u[1], w[1]) || !geo.approx(u[0], h[0]) || !geo.approx(u[1], h[1])) {
    return { holds: false, detail: 'Fails for A = ' + A };
  }
}
return { holds: true, detail: 'N − M = P − Q = (C − A)/2 in 2000 random quadrilaterals.' };`,

  productOfSides: `${POINT}
for (let i = 0; i < 2000; i++) {
  const [A, B, C, D] = geo.randConvexQuad();
  const M = geo.mid(A, B), N = geo.mid(B, C), P = geo.mid(C, D), Q = geo.mid(D, A);
  const area = geo.area(M, N, P, Q), product = geo.dist(M, N) * geo.dist(N, P);
  if (!geo.approx(area, product, 1e-6)) {
    return { holds: false, detail: 'A = ' + f(A) + ', B = ' + f(B) + ', C = ' + f(C) + ', D = ' + f(D) + ': area of MNPQ = ' + area.toFixed(2) + ', but MN · NP = ' + product.toFixed(2) + '.' };
  }
}
return { holds: true, detail: 'Holds for 2000 random convex quadrilaterals.' };`,

  diagonalFormula: `${POINT}
for (let i = 0; i < 2000; i++) {
  const [A, B, C, D] = geo.randConvexQuad();
  const area = geo.area(A, B, C, D), formula = geo.dist(A, C) * geo.dist(B, D) / 2;
  if (!geo.approx(area, formula, 1e-6)) {
    return { holds: false, detail: 'A = ' + f(A) + ', B = ' + f(B) + ', C = ' + f(C) + ', D = ' + f(D) + ': area of ABCD = ' + area.toFixed(2) + ', but AC · BD / 2 = ' + formula.toFixed(2) + '.' };
  }
}
return { holds: true, detail: 'Holds for 2000 random convex quadrilaterals.' };`,

  similar: `${POINT}
for (let i = 0; i < 2000; i++) {
  const [A, B, C, D] = geo.randConvexQuad();
  const M = geo.mid(A, B), N = geo.mid(B, C), P = geo.mid(C, D), Q = geo.mid(D, A);
  const big = [geo.angle(D, A, B), geo.angle(A, B, C), geo.angle(B, C, D), geo.angle(C, D, A)];
  const small = [geo.angle(Q, M, N), geo.angle(M, N, P), geo.angle(N, P, Q), geo.angle(P, Q, M)];
  if (big.some((a, k) => !geo.approx(a, small[k], 1e-6))) {
    return { holds: false, detail: 'A = ' + f(A) + ', B = ' + f(B) + ', C = ' + f(C) + ', D = ' + f(D) + ': angle at A is ' + big[0].toFixed(1) + '°, angle at M is ' + small[0].toFixed(1) + '°.' };
  }
}
return { holds: true, detail: 'Same angles in 2000 random quadrilaterals.' };`,
};

const FREE = { A: [-6, -3], B: [5, -4], C: [7, 3], D: [-3, 5] } as Record<string, [number, number]>;

const VERDICTS: Record<number, Omit<FirstPassStep, 'step'>> = {
  0: { status: 'valid', quote: '', reason: 'An auxiliary diagonal – a legitimate construction.', evidence: '', deduction: 0, ...noCheck },
  1: { status: 'valid', quote: '', reason: 'Midline theorem in triangle ABC (M, N are midpoints of AB, BC).', evidence: '', deduction: 0, ...noCheck },
  2: { status: 'valid', quote: '', reason: 'Midline theorem in triangle ACD (Q, P are midpoints of AD, CD).', evidence: '', deduction: 0, ...noCheck },
  3: {
    status: 'gap',
    quote: 'hence $MNPQ$ is a parallelogram',
    reason: 'One pair of opposite sides parallel and equal only gives a parallelogram if these sides point the same way; otherwise MNPQ could be crossed. This is not argued.',
    evidence: 'The step does not say why the vertices M, N, P, Q come in the order of a parallelogram.',
    deduction: 1,
    check_code: GEO_CODE.parallelSides,
    check_claim: 'Opposite sides of MNPQ are parallel',
  },
  4: {
    status: 'error',
    quote: 'The area of $MNPQ$ is $MN \\cdot NP$',
    reason: 'The area of a parallelogram is base times height, not the product of two sides – that only holds for rectangles.',
    evidence: S`A parallelogram with sides 1 and 1 and an angle of $30^\circ$ has area $\tfrac12$, not 1.`,
    deduction: 2,
    check_code: GEO_CODE.productOfSides,
    check_claim: 'The area of MNPQ equals MN · NP',
  },
  5: {
    status: 'error',
    quote: 'the area of $ABCD$ is $\\tfrac12 AC \\cdot BD$',
    reason: S`This formula needs perpendicular diagonals; in general $[ABCD] = \tfrac12 AC \cdot BD \cdot \sin\theta$, where $\theta$ is the angle between the diagonals.`,
    evidence: S`A parallelogram with sides 2 and 1 and an angle of $60^\circ$ has area $\sqrt3 \approx 1.73$, but its diagonals are $\sqrt3$ and $\sqrt7$, giving $\tfrac12\sqrt{21} \approx 2.29$.`,
    deduction: 2,
    check_code: GEO_CODE.diagonalFormula,
    check_claim: 'The area of ABCD equals AC · BD / 2',
  },
};

const SOLUTIONS: Solution[] = [
  {
    steps: [
      {
        id: 'a1',
        text: S`Treat points as vectors. Then $M = \tfrac{A+B}{2}$, $N = \tfrac{B+C}{2}$, $P = \tfrac{C+D}{2}$, $Q = \tfrac{D+A}{2}$.`,
        justification: 'Definition of the midpoint.',
      },
      { id: 'a2', text: S`$N - M = \tfrac{C - A}{2}$ and $P - Q = \tfrac{C - A}{2}$.`, justification: 'Subtract the expressions from a1.' },
      {
        id: 'a3',
        text: S`So $\vec{MN} = \vec{QP}$: the sides $MN$ and $QP$ are parallel, equally long and point the same way, hence $MNPQ$ is a parallelogram.`,
        justification: S`A quadrilateral $MNPQ$ with $\vec{MN} = \vec{QP}$ is a parallelogram; this follows from a2.`,
      },
      { id: 'a4', text: S`Likewise $Q - M = \tfrac{D - B}{2}$.`, justification: 'Same computation as a2.' },
      {
        id: 'a5',
        text: S`The parallelogram spanned by $u$ and $v$ has area $|u \times v|$, so $[MNPQ] = \left|\tfrac{C-A}{2} \times \tfrac{D-B}{2}\right| = \tfrac14 |(C-A) \times (D-B)|$.`,
        justification: 'a2, a4 and the cross-product formula for the area of a parallelogram.',
      },
      {
        id: 'a6',
        text: S`$[ABCD] = [ABC] + [ACD] = \tfrac12 |(C-A) \times (B-A)| + \tfrac12 |(C-A) \times (D-A)| = \tfrac12 |(C-A) \times (D-B)|$.`,
        justification: S`Split along the diagonal $AC$; by convexity $B$ and $D$ lie on opposite sides of $AC$, so the two cross products have opposite signs and combine.`,
      },
      { id: 'a7', text: S`Hence $[MNPQ] = \tfrac12 [ABCD]$.`, justification: 'Compare a5 and a6.' },
    ],
    final_answer: '',
    final_answer_normalized: '',
    why_it_works: 'Midpoints are averages, and averages are linear: in vectors, every statement about the midpoints becomes a one-line computation.',
    when_to_try: 'When a problem is full of midpoints, centroids or points dividing segments in a ratio – all of these are linear in vectors.',
    checks: [
      { claim: 'N − M = P − Q = (C − A)/2', code: GEO_CODE.vectorsEqual },
      { claim: 'The area of MNPQ is half the area of ABCD', code: GEO_CODE.areaHalf },
    ],
    figure_code: GEO_CODE.vectorFigure,
    free_points: FREE,
  },
  {
    steps: [
      {
        id: 'a1',
        text: S`$[MNPQ] = [ABCD] - [AMQ] - [BNM] - [CPN] - [DQP]$.`,
        justification: 'By convexity, MNPQ and the four corner triangles tile ABCD.',
      },
      {
        id: 'a2',
        text: S`Triangle $AMQ$ is triangle $ABD$ scaled from $A$ by the factor $\tfrac12$, so $[AMQ] = \tfrac14 [ABD]$.`,
        justification: 'M and Q are the midpoints of AB and AD; scaling lengths by 1/2 scales areas by 1/4.',
      },
      {
        id: 'a3',
        text: S`In the same way $[BNM] = \tfrac14 [BCA]$, $[CPN] = \tfrac14 [CDB]$ and $[DQP] = \tfrac14 [DAC]$.`,
        justification: 'The argument of a2 at the corners B, C, D.',
      },
      {
        id: 'a4',
        text: S`$[ABD] + [CDB] = [ABCD]$ and $[BCA] + [DAC] = [ABCD]$.`,
        justification: 'Each diagonal splits the convex quadrilateral into two triangles.',
      },
      {
        id: 'a5',
        text: S`So the four corners add up to $\tfrac14 \cdot 2[ABCD] = \tfrac12 [ABCD]$, and $[MNPQ] = \tfrac12 [ABCD]$.`,
        justification: 'Insert a2–a4 into a1.',
      },
    ],
    final_answer: '',
    final_answer_normalized: '',
    why_it_works: 'The corner triangles are scaled copies of triangles you know, so their areas are easy – even though MNPQ itself is not.',
    when_to_try: 'When an area is awkward to compute directly but the leftover pieces are simple (scaled, congruent or sharing a base).',
    checks: [],
    figure_code: null,
    free_points: {},
  },
  {
    steps: [
      {
        id: 'a1',
        text: S`Each side of $MNPQ$ is half a diagonal of $ABCD$, so $MNPQ$ is similar to $ABCD$ with ratio $\tfrac{1}{\sqrt2}$.`,
        justification: 'Midline theorem.',
      },
      { id: 'a2', text: S`Hence $[MNPQ] = \left(\tfrac{1}{\sqrt2}\right)^2 [ABCD] = \tfrac12 [ABCD]$.`, justification: 'Areas of similar figures scale with the square of the ratio.' },
    ],
    final_answer: '',
    final_answer_normalized: '',
    why_it_works: 'Similar figures have areas in the ratio of the squared side ratio.',
    when_to_try: 'When two figures have the same shape at different sizes.',
    checks: [{ claim: 'MNPQ is similar to ABCD (same angles in the same order)', code: GEO_CODE.similar }],
    figure_code: null,
    free_points: {},
  },
];

export const geometry: DemoScript = {
  id: 'geometry',
  matches: (problem) => /quadrilateral/i.test(problem),
  transcription: {
    text: GEOMETRY_PROBLEM,
    topic: 'geometry',
    figure:
      'A convex quadrilateral ABCD (labelled counter-clockwise). M, N, P, Q lie on AB, BC, CD, DA and are marked as midpoints with tick marks. The quadrilateral MNPQ is drawn inside ABCD and shaded.',
    uncertain: [],
  },
  hints: {
    1: {
      explanation: S`Draw any four-cornered shape without dents. Mark the middle of each side and connect these four middle points in order. (a) Show that the new shape always has parallel opposite sides. (b) Show that it always covers exactly half of the original area – for every such shape, not just nice ones.`,
      glossary: [
        { term: 'convex quadrilateral', meaning: 'A four-sided shape where every inner angle is less than 180°, so it has no dents.' },
        { term: 'midpoint', meaning: 'The point exactly in the middle of a segment.' },
        { term: 'parallelogram', meaning: 'A quadrilateral whose opposite sides are parallel (and therefore equally long).' },
        { term: S`$[XYZ]$`, meaning: 'Common notation for the area of the figure XYZ.' },
      ],
    },
    2: {
      given: [S`$ABCD$ is a convex quadrilateral – otherwise arbitrary.`, S`$M, N, P, Q$ are the midpoints of $AB$, $BC$, $CD$, $DA$.`],
      wanted: [S`(a) $MNPQ$ is a parallelogram.`, S`(b) $[MNPQ] = \tfrac12 [ABCD]$.`],
      notes: 'Your argument must work for every convex quadrilateral – no right angles or equal sides may be assumed.',
    },
    3: {
      kind: 'figure',
      intro: 'Your quadrilateral – drag the corners A, B, C, D (keep it without dents) and watch the numbers.',
      code: GEO_CODE.figure,
      free_points: FREE,
      what_to_look_for: 'Which lengths come in equal pairs, however you drag? How do the two areas compare?',
    },
    5: {
      method: 'Midline theorem (midsegment of a triangle)',
      principle_sentence: 'The segment joining the midpoints of two sides of a triangle is parallel to the third side and half as long.',
      why_here: 'All four points are midpoints. Look for triangles in the figure in which two of them are midpoints of two sides.',
      self_question: 'Which segment could you draw into ABCD so that M and N become midpoints of two sides of a triangle?',
    },
    6: {
      parts: [
        { label: 'Auxiliary line', purpose: 'A segment that creates triangles in which the midpoints appear.' },
        { label: '(a) One pair of sides', purpose: 'Show that two opposite sides of MNPQ are parallel and equal – and point the same way.' },
        { label: '(a) Conclusion', purpose: 'Name the criterion that turns this into "parallelogram".' },
        { label: '(b) Pieces', purpose: 'Express [MNPQ] through areas that are easier to compare with [ABCD].' },
        { label: '(b) Comparison', purpose: 'Add up and compare with [ABCD] – valid for every convex quadrilateral.' },
      ],
    },
  },
  conjecture(input) {
    const c = input.conjecture.toLowerCase();
    if (/half|1\/2|0\.5|twice|double/.test(c)) {
      return {
        verdict: 'consistent',
        feedback: 'Yes – however you drag, the area of MNPQ stays exactly half of the area of ABCD. The code below tested 2000 random quadrilaterals. Now the work is to see why.',
        nudge: 'Which pieces of ABCD are not part of MNPQ? Do they look like anything you know?',
        check_code: GEO_CODE.areaHalf,
        check_claim: 'The area of MNPQ is half the area of ABCD',
      };
    }
    if (/parallel|equal|same length|mn ?= ?pq/.test(c)) {
      return {
        verdict: 'partly',
        feedback: 'Right: MN = PQ and NP = QM in every position, so opposite sides match. That is part (a). Did you also look at the two areas?',
        nudge: 'Compare "area MNPQ" with "area ABCD" while you drag.',
        check_code: GEO_CODE.parallelSides,
        check_claim: 'Opposite sides of MNPQ are parallel',
      };
    }
    if (/square|rectangle|rhomb/.test(c)) {
      return {
        verdict: 'inconsistent',
        feedback: 'Drag D far to the right: MNPQ gets slanted, so it is not a rectangle or square in general.',
        nudge: 'What stays the same, even when the shape gets slanted?',
        ...noCheck,
      };
    }
    return {
      verdict: 'unclear',
      feedback: 'I am not sure which property you mean. Try to state it as "however I drag, … stays …".',
      nudge: 'Watch the six numbers next to the figure while you drag one corner.',
      ...noCheck,
    };
  },
  steps: GEOMETRY_STEPS,
  ownVersionSteps: OWN_VERSION_STEPS,
  verdicts: VERDICTS,
  summary: 'Part (a) is correct – the midline idea carries. Part (b) uses two area formulas that only hold for special shapes.',
  ownVersionComment: 'You worked with position vectors throughout – exactly the idea of this approach.',
  refute(input) {
    if (/parallelogram/.test(input.critique.quote)) {
      return {
        upheld: false,
        reasoning: S`The critique is not convincing: by steps 2 and 3 both $MN$ and $QP$ equal half of $AC$ as vectors (both point from the $A$-side towards $C$), so $\vec{MN} = \vec{QP}$, which is a standard criterion for a parallelogram.`,
      };
    }
    return {
      upheld: true,
      reasoning:
        /MN \\cdot NP/.test(input.critique.quote)
          ? 'I could not defend the step: the area of a parallelogram depends on its angle, so the product of two sides only gives the area of a rectangle.'
          : S`I could not defend the step: $\tfrac12 AC \cdot BD$ is the area only when the diagonals are perpendicular (e.g. for a kite or a rhombus), not for every convex quadrilateral.`,
    };
  },
  discuss(input) {
    const last = input.history[input.history.length - 1];
    const quote = input.critique.quote;
    if (last?.role === 'check') {
      return {
        reply: S`The test settles it: ${last.text} So the formula in step ${input.stepId} does not hold for every quadrilateral. Your result (b) is still true – it just needs a different argument.`,
        outcome: 'maintain',
        open_point: '',
        ...noCheck,
      };
    }
    if (/parallelogram/.test(quote)) {
      return {
        reply: S`You are right: by your steps 2 and 3 both $MN$ and $QP$ are parallel to $AC$, half as long, and point from the $A$-side towards $C$, so $\vec{MN} = \vec{QP}$. That is enough for a parallelogram – I was too strict. Step ${input.stepId} is valid.`,
        outcome: 'agree_valid',
        open_point: '',
        ...noCheck,
      };
    }
    if (/MN \\cdot NP/.test(quote)) {
      return {
        reply: 'I read your step as: "the area of a parallelogram is the product of two adjacent sides". That is only true for rectangles – a parallelogram can be squeezed flat while its sides keep their length. Let us test it on random quadrilaterals.',
        outcome: 'maintain',
        open_point: '',
        check_code: GEO_CODE.productOfSides,
        check_claim: 'The area of MNPQ equals MN · NP',
      };
    }
    if (/AC/.test(quote)) {
      return {
        reply: S`I read your step as: "every convex quadrilateral has area $\tfrac12 AC \cdot BD$". That needs perpendicular diagonals. Let us test it.`,
        outcome: 'maintain',
        open_point: '',
        check_code: GEO_CODE.diagonalFormula,
        check_claim: 'The area of ABCD equals AC · BD / 2',
      };
    }
    return {
      reply: 'Thanks for explaining. Which earlier step or which theorem does your step follow from?',
      outcome: 'clarify',
      open_point: '',
      ...noCheck,
    };
  },
  askImage: (q, explain) =>
    explain
      ? "(Demo mode can't look at your marking, so this is a sample answer.) Here you compute the area of MNPQ. Ask yourself: is the area of a parallelogram really the product of two sides? Drag the figure in the hints so that MNPQ becomes very slanted and compare."
      : `(Demo mode sample answer to "${q}".) Check which theorem each marked claim uses, and whether that theorem needs extra assumptions – right angles or perpendicular diagonals, for example.`,
  correct: (stepId) => ({
    approaches: [
      {
        name: '(a) Midlines through the diagonal AC',
        approach_works: 'yes',
        works_why: 'The midline theorem in triangles ABC and ACD gives one pair of parallel, equal sides – a complete argument.',
        fails_at: null,
        fails_why: '',
        fix_hints: [],
      },
      {
        name: '(b) Area from side lengths',
        approach_works: 'no',
        works_why: 'Lengths alone cannot determine the area of a parallelogram or a quadrilateral – the angles matter.',
        fails_at: stepId(4),
        fails_why: S`$MN \cdot NP$ is the area only of a rectangle, and step 6 uses $[ABCD] = \tfrac12 AC \cdot BD$, which needs perpendicular diagonals.`,
        fix_hints: [
          'Instead of computing [MNPQ] directly, look at what is left over: the four corner triangles.',
          S`Triangle $AMQ$ is triangle $ABD$ shrunk by $\tfrac12$ from $A$, so $[AMQ] = \tfrac14 [ABD]$. Do the same at the other corners and add up.`,
        ],
      },
    ],
  }),
  ideas: [
    {
      one_liner: S`Instead of midlines, you could compute with position vectors: $M = \tfrac{A+B}{2}$ etc., and compare $N - M$ with $P - Q$.`,
      principle: 'Vectors',
      principle_sentence: 'Translating a geometric statement into vectors turns "parallel and equal" into "the same vector", and areas into cross products.',
    },
    {
      one_liner: 'Instead of computing the area of MNPQ directly, you could subtract the four corner triangles from ABCD.',
      principle: 'Area decomposition',
      principle_sentence: 'To find an area that is hard to compute, write it as a known area minus pieces that are easy to compare.',
    },
    {
      one_liner: S`Instead of midlines, you could show that $MNPQ$ is similar to $ABCD$ with ratio $\tfrac{1}{\sqrt2}$.`,
      principle: 'Similarity',
      principle_sentence: 'Similar figures with side ratio k have areas in the ratio k².',
    },
  ],
  solutions: SOLUTIONS,
  verifierChecks: {},
  challengeCheck: (text) =>
    /N - M/.test(text) ? { claim: 'N − M = P − Q = (C − A)/2', code: GEO_CODE.vectorsEqual } : null,
};
