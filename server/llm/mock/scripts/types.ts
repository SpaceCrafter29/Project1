import type { ConjectureRequest, DiscussRequest } from '../../../../shared/api';
import type {
  CheckSpec,
  ConjectureFeedback,
  Correction,
  DiscussReply,
  FirstPassStep,
  GivenWanted,
  Idea,
  MethodHint,
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
  conjecture(input: ConjectureRequest): ConjectureFeedback;
  /** The scripted handwritten solution, and the student's later version with a new idea. */
  steps: string[];
  ownVersionSteps: string[];
  /** First-pass verdict per index of `steps`. */
  verdicts: Record<number, Omit<FirstPassStep, 'step'>>;
  summary: string;
  ownVersionComment: string;
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
