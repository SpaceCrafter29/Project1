import type { Draft } from 'immer';
import { applyDiscussion, mergeVerdict, type FinalVerdict } from '../../../shared/verdict';
import { api } from '../../lib/api';
import { runCheck } from '../../lib/sandbox';
import type { Assessment, Attempt, StepReview } from '../../session/types';
import { uid } from '../../session/useSession';

export type AttemptUpdater = (recipe: (draft: Draft<Attempt>) => void) => void;

export function newAttempt(images: string[], steps: { text: string; unclear: boolean }[], unreadable: string[], intendedIdea?: string): Attempt {
  const withIds = steps.map((s, i) => ({ id: `s${i + 1}`, text: s.text, unclear: s.unclear }));
  return {
    id: uid('a_'),
    images,
    steps: withIds.map(({ id, text }) => ({ id, text })),
    unclearSteps: withIds.filter((s) => s.unclear).map((s) => s.id),
    unreadable,
    recognized: true,
    confirmed: false,
    annotations: [],
    intendedIdea,
  };
}

/**
 * Step evaluation pipeline: the server returns first-pass verdicts plus an independent
 * refutation attempt for every critique; the browser runs the code checks and merges
 * everything into the verdict the student sees.
 */
export async function assessAttempt(problem: string, attempt: Attempt): Promise<Assessment> {
  const result = await api.evaluate({ problem, steps: attempt.steps, intendedIdea: attempt.intendedIdea });
  const steps = await Promise.all(
    result.steps.map(async (evaluated): Promise<StepReview> => {
      const step = attempt.steps.find((s) => s.id === evaluated.step);
      const check = evaluated.check_code
        ? await runCheck(evaluated.check_claim || 'The claim made in this step', evaluated.check_code, 'evaluation')
        : undefined;
      const verified = mergeVerdict({
        stepText: step?.text ?? '',
        firstPass: evaluated,
        refutation: evaluated.refutation,
        check: check?.outcome,
      });
      return { stepId: evaluated.step, evaluated, check, verified, discussion: [] };
    }),
  );
  return {
    score: result.score,
    summary: result.summary,
    ideaUsed: result.idea_used,
    ideaComment: result.idea_comment,
    steps,
  };
}

export function finalVerdict(review: StepReview): FinalVerdict {
  return applyDiscussion(review.verified, review.discussionOutcome, review.openPoint);
}
