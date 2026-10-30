// Output contracts for every model call. The server validates each model answer
// against these schemas; the client only imports the inferred types.
import { z } from 'zod';

const normalize = (v: unknown) =>
  typeof v === 'string' ? v.trim().toLowerCase().replace(/[\s-]+/g, '_') : v;

/** Enum that tolerates casing/spacing differences in model output ("Partly" -> "partly"). */
function looseEnum<const T extends readonly [string, ...string[]]>(values: T) {
  return z.preprocess(normalize, z.enum(values));
}

const text = z.string().trim();
const optionalText = z.string().trim().nullish().transform((v) => v ?? '');
const optionalCode = z.string().trim().nullish().transform((v) => (v ? v : null));
const points = z.coerce.number().min(0).max(7);
/** Named draggable points of a figure, e.g. {"A": [0, 0], "B": [4, 1]}. */
const freePoints = z
  .record(z.string(), z.tuple([z.coerce.number(), z.coerce.number()]))
  .nullish()
  .transform((v) => v ?? {});

// ---------------------------------------------------------------------------
// 1. Problem transcription

export const TranscriptionSchema = z.object({
  text,
  topic: optionalText,
  /** Description of a figure in the image (geometry), empty if there is none. */
  figure: optionalText,
  uncertain: z.array(text).default([]),
});
export type Transcription = z.infer<typeof TranscriptionSchema>;

// ---------------------------------------------------------------------------
// 2. Coaching: personalized tips, and the tools they can attach

export const SimpleWordsSchema = z.object({
  explanation: text,
  glossary: z.array(z.object({ term: text, meaning: text })).default([]),
});
export type SimpleWords = z.infer<typeof SimpleWordsSchema>;

export const GivenWantedSchema = z.object({
  given: z.array(text).min(1),
  wanted: z.array(text).min(1),
  notes: optionalText,
});
export type GivenWanted = z.infer<typeof GivenWantedSchema>;

export const SmallCasesSchema = z.object({
  intro: text,
  /** "table" for small cases, "figure" for an interactive geometry construction. */
  kind: looseEnum(['table', 'figure'] as const).catch('table'),
  code: text,
  free_points: freePoints,
  what_to_look_for: optionalText,
});
export type SmallCases = z.infer<typeof SmallCasesSchema>;

/** Tools the coach can attach to a tip (they correspond to the hint stages below). */
export const HINT_TOOLS = ['none', 'simple_words', 'given_wanted', 'small_cases', 'method', 'skeleton'] as const;
export type HintTool = (typeof HINT_TOOLS)[number];

/** One personalized tip, based on the student's photographed progress. */
export const NextHintSchema = z.object({
  /** What the student has already achieved, acknowledged concretely (empty at the start). */
  progress: optionalText,
  status: looseEnum(['not_started', 'on_track', 'stuck', 'off_track', 'complete'] as const).catch('on_track'),
  hint: text,
  question: optionalText,
  /** 1 = direction, 2 = concrete idea, 3 = the key insight of the next step, stated plainly. */
  level: z.coerce.number().int().min(1).max(3).catch(1),
  tool: looseEnum(HINT_TOOLS).catch('none'),
  focus_step: z.coerce.string().nullish().transform((v) => (v && v !== 'null' ? v : null)),
  check_code: optionalCode,
  check_claim: optionalText,
});
export type NextHint = z.infer<typeof NextHintSchema>;

export const MethodHintSchema = z.object({
  method: text,
  principle_sentence: text,
  why_here: text,
  self_question: optionalText,
});
export type MethodHint = z.infer<typeof MethodHintSchema>;

export const SkeletonSchema = z.object({
  parts: z.array(z.object({ label: text, purpose: text })).min(1),
});
export type Skeleton = z.infer<typeof SkeletonSchema>;

// ---------------------------------------------------------------------------
// 3./4. Recognition of a handwritten solution

const fraction = z.coerce.number().min(0).max(1);

/** Where a step is written on the photo: page index and a box in fractions of the image size. */
export const StepBoxSchema = z.object({
  page: z.coerce.number().int().min(0).catch(0),
  x: fraction,
  y: fraction,
  w: fraction,
  h: fraction,
});
export type StepBox = z.infer<typeof StepBoxSchema>;

export const RecognitionSchema = z.object({
  steps: z
    .array(
      z.object({
        text,
        unclear: z.boolean().default(false),
        // An unusable box is dropped rather than failing the whole recognition.
        box: StepBoxSchema.nullish().catch(null).transform((b) => b ?? null),
      }),
    )
    .min(1),
  unreadable: z.array(text).default([]),
});
export type Recognition = z.infer<typeof RecognitionSchema>;

// ---------------------------------------------------------------------------
// 5. Step evaluation (first pass) and independent refutation

export const StepStatus = looseEnum(['valid', 'gap', 'error', 'unclear'] as const);
export type StepStatusValue = 'valid' | 'gap' | 'error' | 'unclear';

export const FirstPassStepSchema = z.object({
  step: z.coerce.string(),
  status: StepStatus,
  quote: optionalText,
  reason: text,
  evidence: optionalText,
  deduction: points.default(0),
  check_code: optionalCode,
  check_claim: optionalText,
  /** Imprecise wording or notation (not a mathematical error): quoted, explained, with a better wording. */
  wording: z.array(z.object({ quote: text, issue: text, suggestion: optionalText })).default([]),
  /** One concrete way to make this step stronger or clearer; empty if nothing to add. */
  improve: optionalText,
});
export type FirstPassStep = z.infer<typeof FirstPassStepSchema>;
export type WordingNote = FirstPassStep['wording'][number];

export const EvaluationSchema = z.object({
  steps: z.array(FirstPassStepSchema),
  score: points,
  summary: text,
  /** What the student did well, concretely. */
  strengths: z.array(text).default([]),
  /** The changes that would improve the write-up most, most important first. */
  improvements: z.array(text).default([]),
});
export type Evaluation = z.infer<typeof EvaluationSchema>;

export const RefutationSchema = z.object({
  upheld: z.boolean(),
  reasoning: text,
});
export type Refutation = z.infer<typeof RefutationSchema>;

// ---------------------------------------------------------------------------
// Discussion mode and questions

export const DiscussReplySchema = z.object({
  reply: text,
  outcome: looseEnum(['agree_valid', 'maintain', 'clarify', 'open'] as const),
  open_point: optionalText,
  check_code: optionalCode,
  check_claim: optionalText,
});
export type DiscussReply = z.infer<typeof DiscussReplySchema>;

export const AskReplySchema = z.object({ answer: text });
export type AskReply = z.infer<typeof AskReplySchema>;

// ---------------------------------------------------------------------------
// 7. Correction of the student's own approach

export const CorrectionSchema = z.object({
  approaches: z
    .array(
      z.object({
        name: text,
        approach_works: looseEnum(['yes', 'partly', 'no'] as const),
        works_why: text,
        fails_at: z.coerce.string().nullish().transform((v) => (v && v !== 'null' ? v : null)),
        fails_why: optionalText,
        fix_hints: z.array(text).default([]),
      }),
    )
    .min(1),
});
export type Correction = z.infer<typeof CorrectionSchema>;
export type CorrectionApproach = Correction['approaches'][number];

// ---------------------------------------------------------------------------
// 8. Alternative approaches pipeline

export const IdeasSchema = z.object({
  ideas: z
    .array(z.object({ one_liner: text, principle: text, principle_sentence: text }))
    .min(1)
    .max(4),
});
export type Idea = z.infer<typeof IdeasSchema>['ideas'][number];

const CheckSpecSchema = z.object({ claim: text, code: text });
export type CheckSpec = z.infer<typeof CheckSpecSchema>;

export const SolutionSchema = z.object({
  steps: z.array(z.object({ id: z.coerce.string(), text, justification: optionalText })).min(1),
  final_answer: optionalText,
  final_answer_normalized: optionalText,
  why_it_works: text,
  when_to_try: text,
  checks: z.array(CheckSpecSchema).default([]),
  /** Optional interactive figure for geometric solutions. */
  figure_code: optionalCode,
  free_points: freePoints,
});
export type Solution = z.infer<typeof SolutionSchema>;

export const VerificationSchema = z.object({
  overall: looseEnum(['valid', 'flawed', 'unclear'] as const),
  steps: z
    .array(
      z.object({
        id: z.coerce.string(),
        follows: looseEnum(['yes', 'no', 'unclear'] as const),
        hidden_assumptions: optionalText,
        comment: optionalText,
      }),
    )
    .default([]),
  issues_summary: optionalText,
  checks: z.array(CheckSpecSchema).default([]),
});
export type Verification = z.infer<typeof VerificationSchema>;

export const ChallengeSchema = z.object({
  verdict: looseEnum(['step_valid', 'step_flawed', 'unclear'] as const),
  explanation: text,
  check_code: optionalCode,
  check_claim: optionalText,
});
export type Challenge = z.infer<typeof ChallengeSchema>;
