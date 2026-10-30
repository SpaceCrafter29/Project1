// Validation of incoming request bodies.
import { z } from 'zod';

const imageUrl = z
  .string()
  .regex(/^data:image\/(png|jpe?g|webp|gif);base64,/, 'images must be base64 data URLs');
const images = z.array(imageUrl).min(1).max(8);
const problem = z.string().trim().min(1).max(20_000);
const step = z.object({ id: z.string().min(1).max(20), text: z.string().max(5_000) });
const steps = z.array(step).min(1).max(80);
const turn = z.object({ role: z.enum(['user', 'coach', 'check']), text: z.string().max(10_000) });
const history = z.array(turn).max(60).default([]);
const status = z.enum(['valid', 'gap', 'error', 'unclear']);
const idea = z.object({ one_liner: z.string().min(1), principle: z.string().min(1), principle_sentence: z.string() });

export const requestSchemas = {
  transcribe: z.object({ images }),
  hint: z.object({ problem, stage: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(5), z.literal(6)]) }),
  nexthint: z.object({
    problem,
    progress: z.array(step).max(80),
    previousProgress: z.array(step).max(80).default([]),
    note: z.string().max(2_000).default(''),
    history: z.array(z.object({ hint: z.string().max(5_000), level: z.number().int().min(1).max(3) })).max(30).default([]),
    part: z.object({ label: z.string().max(4), text: z.string().max(5_000) }).nullish(),
    earlierParts: z
      .array(z.object({ label: z.string().max(4), work: z.array(z.string().max(5_000)).max(80) }))
      .max(10)
      .default([]),
  }),
  recognize: z.object({ problem, images, partial: z.boolean().optional(), intendedIdea: z.string().max(1_000).optional() }),
  evaluate: z.object({ problem, steps }),
  discuss: z.object({
    problem,
    steps,
    stepId: z.string(),
    critique: z.object({ status, reason: z.string(), quote: z.string(), evidence: z.string() }),
    history,
  }),
  ask: z.object({
    problem,
    question: z.string().max(2_000),
    history,
    studentSteps: steps.optional(),
    context: z.discriminatedUnion('kind', [
      z.object({ kind: z.literal('image'), crop: imageUrl, fullImage: imageUrl }),
      z.object({ kind: z.literal('text'), marked: steps, solution: steps }),
    ]),
  }),
  correct: z.object({
    problem,
    steps,
    verdicts: z.array(z.object({ stepId: z.string(), status, reason: z.string() })),
  }),
  propose: z.object({ problem, steps }),
  develop: z.object({ problem, idea }),
  challenge: z.object({ problem, solution: steps, stepId: z.string(), concern: z.string().max(2_000) }),
};
