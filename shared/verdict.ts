// Turns a first-pass critique, its independent refutation attempt and an optional
// code check into the verdict the student sees. The rule: a step is only shown as
// "gap" or "error" when the critique quotes the step, survived the refutation attempt
// and is not contradicted by code. Everything else that is doubtful becomes "unclear".
import type { CheckOutcome } from './codecheck';
import type { FirstPassStep, Refutation, StepStatusValue } from './schemas';

export interface FinalVerdict {
  status: StepStatusValue;
  reason: string;
  /** Short notes on how the verdict was reached ("Prüfdetails"). */
  notes: string[];
}

export interface MergeInput {
  stepText: string;
  firstPass: FirstPassStep;
  refutation: Refutation | null;
  check?: CheckOutcome | null;
}

const squash = (s: string) =>
  s
    .toLowerCase()
    .replace(/\\[,;:! ]|\\(left|right)|[$\s{}"'`“”‘’]/g, '')
    .replace(/\\cdot|\\times/g, '*');

/** True when every fragment of the quote (split at "...") appears in order in the step. */
export function quoteFound(quote: string, stepText: string): boolean {
  const fragments = quote
    .split(/\.\.\.|…/)
    .map(squash)
    .filter((f) => f.length > 0);
  if (fragments.length === 0 || fragments.join('').length < 3) return false;
  const haystack = squash(stepText);
  let from = 0;
  for (const fragment of fragments) {
    const at = haystack.indexOf(fragment, from);
    if (at < 0) return false;
    from = at + fragment.length;
  }
  return true;
}

export function mergeVerdict({ stepText, firstPass, refutation, check }: MergeInput): FinalVerdict {
  const notes: string[] = [];
  const holds = check?.ran ? check.holds : null;
  const detail = check?.detail ?? '';
  if (check && !check.ran) notes.push(`Code check could not decide: ${detail}`);

  if (firstPass.status === 'valid') {
    if (holds === false) {
      notes.push(`Code check found a counterexample: ${detail}`);
      return {
        status: 'unclear',
        reason: 'The coach found no problem here, but a numerical test disagrees. Please check this step yourself.',
        notes,
      };
    }
    if (holds === true) notes.push(`Code check passed: ${detail}`);
    return { status: 'valid', reason: firstPass.reason, notes };
  }

  if (firstPass.status === 'unclear') {
    return { status: 'unclear', reason: firstPass.reason, notes };
  }

  // gap or error: needs a verbatim quote, a surviving critique, and no contradicting code.
  if (!quoteFound(firstPass.quote, stepText)) {
    notes.push('The critique did not quote your step exactly, so it is not shown as a mistake.');
    return { status: 'unclear', reason: firstPass.reason, notes };
  }
  if (!refutation) {
    notes.push('The critique has not been independently checked yet.');
    return { status: 'unclear', reason: firstPass.reason, notes };
  }
  if (!refutation.upheld) {
    notes.push(`An independent check could not confirm the critique: ${refutation.reasoning}`);
    return { status: 'unclear', reason: firstPass.reason, notes };
  }
  notes.push(`Independent check confirmed the critique: ${refutation.reasoning}`);

  if (holds === false) {
    notes.push(`Code check confirms with a counterexample: ${detail}`);
    return { status: 'error', reason: firstPass.reason, notes };
  }
  if (holds === true) {
    if (firstPass.status === 'error') {
      notes.push(`But the code check found no counterexample: ${detail}`);
      return {
        status: 'unclear',
        reason: `${firstPass.reason} (A numerical test did not confirm this, so please check it yourself.)`,
        notes,
      };
    }
    notes.push(`The statement holds in the tested cases (${detail}), but the justification is missing.`);
  }
  return { status: firstPass.status, reason: firstPass.reason, notes };
}

export type DiscussionOutcome = 'agree_valid' | 'maintain' | 'clarify' | 'open';

/** Applies the latest discussion outcome on top of the verified verdict. */
export function applyDiscussion(
  verdict: FinalVerdict,
  outcome: DiscussionOutcome | undefined,
  openPoint?: string,
): FinalVerdict {
  if (outcome === 'agree_valid') {
    return {
      status: 'valid',
      reason: 'After discussion: the coach agrees this step is valid.',
      notes: [...verdict.notes, 'Changed to valid after discussion.'],
    };
  }
  if (outcome === 'open') {
    return {
      status: 'unclear',
      reason: openPoint ? `Open point: ${openPoint}` : verdict.reason,
      notes: [...verdict.notes, 'Left open after discussion.'],
    };
  }
  return verdict;
}

export interface ScoreRange {
  low: number;
  high: number;
}

/**
 * The model's score already subtracts every deduction it proposed. Deductions for
 * critiques that were withdrawn are given back; those that became "unclear" widen the range.
 */
export function scoreRange(
  score: number,
  steps: { firstPass: Pick<FirstPassStep, 'status' | 'deduction'>; final: Pick<FinalVerdict, 'status'> }[],
): ScoreRange {
  let restored = 0;
  let uncertain = 0;
  for (const { firstPass, final } of steps) {
    if (firstPass.status !== 'gap' && firstPass.status !== 'error') continue;
    if (final.status === 'valid') restored += firstPass.deduction;
    else if (final.status === 'unclear') uncertain += firstPass.deduction;
  }
  const clamp = (n: number) => Math.max(0, Math.min(7, Math.round(n)));
  return { low: clamp(score + restored), high: clamp(score + restored + uncertain) };
}
