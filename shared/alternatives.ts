// Decides whether a developed alternative solution may be shown, and how.
// Verified solutions show no badge, solutions without any runnable check get a small
// "only logically checked" note, inconsistent ones are marked "not verified",
// and contradicted ones are never shown.
import type { CheckOutcome } from './codecheck';
import type { Verification } from './schemas';

export type AlternativeVerdict = 'verified' | 'logic_only' | 'unverified' | 'discarded';

export interface AlternativeDecision {
  verdict: AlternativeVerdict;
  reasons: string[];
}

export interface ClaimCheck extends CheckOutcome {
  claim: string;
}

/** Canonical form for comparing final answers across approaches. */
export function normalizeAnswer(answer: string): string {
  return answer
    .toLowerCase()
    .replace(/\\(text|mathrm|operatorname)\{([^}]*)\}/g, '$2')
    .replace(/\\left|\\right|\\[,;:! ]|[$\s.]/g, '')
    .replace(/\\mid/g, '|')
    .replace(/\\cdot|\\times/g, '*')
    .replace(/\\in|∈/g, 'in')
    .replace(/[{}]/g, '');
}

export function decideAlternative(input: {
  verification: Verification;
  checks: ClaimCheck[];
  answer: string;
  otherAnswers: string[];
}): AlternativeDecision {
  const { verification, checks, answer, otherAnswers } = input;
  const reasons: string[] = [];

  if (verification.overall === 'flawed') {
    reasons.push(`Independent check found a flaw: ${verification.issues_summary || 'see step comments'}`);
    return { verdict: 'discarded', reasons };
  }
  const brokenSteps = verification.steps.filter((s) => s.follows === 'no');
  if (brokenSteps.length > 0) {
    reasons.push(`Step ${brokenSteps.map((s) => s.id).join(', ')} does not follow from the previous steps.`);
    return { verdict: 'discarded', reasons };
  }
  const contradicted = checks.filter((c) => c.ran && c.holds === false);
  if (contradicted.length > 0) {
    for (const c of contradicted) reasons.push(`Code contradicts "${c.claim}": ${c.detail}`);
    return { verdict: 'discarded', reasons };
  }

  let verdict: AlternativeVerdict = 'verified';
  const mine = normalizeAnswer(answer);
  if (mine) {
    const differing = otherAnswers.filter((a) => normalizeAnswer(a) && normalizeAnswer(a) !== mine);
    if (differing.length > 0) {
      reasons.push(`The result "${answer}" differs from another approach ("${differing[0]}").`);
      verdict = 'unverified';
    }
  }
  if (verification.overall === 'unclear') {
    reasons.push(`The independent check was not sure: ${verification.issues_summary || 'no details'}`);
    verdict = 'unverified';
  }
  const unclearSteps = verification.steps.filter((s) => s.follows === 'unclear');
  if (unclearSteps.length > 0) {
    reasons.push(`The independent check was unsure about step ${unclearSteps.map((s) => s.id).join(', ')}.`);
    verdict = 'unverified';
  }

  const passed = checks.filter((c) => c.ran && c.holds === true);
  for (const c of passed) reasons.push(`Code confirmed "${c.claim}": ${c.detail}`);
  if (verdict === 'verified' && passed.length === 0) {
    reasons.push('No claim could be tested numerically; the solution was checked logically only.');
    verdict = 'logic_only';
  }
  return { verdict, reasons };
}
