import type { DiscussRequest, NextHintRequest } from '../../../../shared/api';
import type {
  CheckSpec,
  Correction,
  DiscussReply,
  FirstPassStep,
  GivenWanted,
  Idea,
  MethodHint,
  NextHint,
  Refutation,
  SimpleWords,
  Skeleton,
  SmallCases,
  Solution,
  Transcription,
} from '../../../../shared/schemas';
import type { RefuteInput } from '../../../prompts/attempt';

/** Everything the demo provider answers for one scripted problem. */
export interface DemoScript {
  id: string;
  /** Recognizes the (confirmed) problem text of this script. */
  matches(problem: string): boolean;
  transcription: Transcription;
  hints: { 1: SimpleWords; 2: GivenWanted; 3: SmallCases; 5: MethodHint; 6: Skeleton };
  /** What the demo "reads" from a progress photo in the tip loop. */
  progressSteps: string[];
  /** A personalized tip; `level` is already escalated when the student made no progress. */
  nextHint(input: NextHintRequest, level: 1 | 2 | 3): NextHint;
  /** Tips for part (b) and later, which can build on the earlier parts. */
  laterPartHint(input: NextHintRequest, level: 1 | 2 | 3): NextHint;
  /** The scripted handwritten solution, and the student's later version with a new idea. */
  steps: string[];
  ownVersionSteps: string[];
  /** First-pass verdict per index of `steps`. */
  verdicts: Record<number, Omit<FirstPassStep, 'step'>>;
  summary: string;
  strengths: string[];
  improvements: string[];
  /** The correction of the student's own version, judged on its own merits. */
  ownVersion: {
    verdicts: Record<number, Omit<FirstPassStep, 'step'>>;
    score: number;
    summary: string;
    strengths: string[];
    improvements: string[];
  };
  /** Which handwritten lines of the sample photos belong to which step (see sampleLayout.json). */
  layout: { solution: string; solutionLines: number[][]; ownVersion: string; ownVersionLines: number[][] };
  refute(input: RefuteInput): Refutation;
  discuss(input: DiscussRequest): DiscussReply;
  /** Sample answer for a question about a pen marking on the student's photo. */
  askImage(question: string, explain: boolean): string;
  correct(stepId: (index: number) => string | null): Correction;
  ideas: Idea[];
  solutions: Solution[];
  /** Extra claims the independent verifier wants tested, per solution index. */
  verifierChecks: Record<number, CheckSpec[]>;
  /** Code test used when the student challenges a step of a model solution. */
  challengeCheck(stepText: string): CheckSpec | null;
}

export const S = String.raw;

export const noCheck = { check_code: null, check_claim: '' };

const squash = (s: string) => s.replace(/\s+/g, ' ').trim();

/** True when the student's work contains (almost) all steps of the scripted full solution. */
export function looksComplete(progress: { text: string }[], fullSteps: string[]): boolean {
  const have = new Set(progress.map((s) => squash(s.text)));
  return fullSteps.filter((s) => have.has(squash(s))).length >= fullSteps.length - 1;
}
