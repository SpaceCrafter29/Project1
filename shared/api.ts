// Request/response contracts between the browser and the local server.
import type {
  AskReply,
  Challenge,
  Correction,
  DiscussReply,
  Evaluation,
  FirstPassStep,
  GivenWanted,
  Idea,
  MethodHint,
  NextHint,
  Recognition,
  Refutation,
  SimpleWords,
  Skeleton,
  SmallCases,
  Solution,
  StepStatusValue,
  Transcription,
  Verification,
} from './schemas';

export interface ServerConfig {
  provider: 'meta' | 'mock';
  models: { fast: string; solver: string; verifier: string };
}

export interface Usage {
  calls: number;
  promptTokens: number;
  completionTokens: number;
}

/** A step of a solution as confirmed by the student (or written by the coach). */
export interface SolutionStep {
  id: string;
  text: string;
}

export interface ChatTurn {
  role: 'user' | 'coach' | 'check';
  text: string;
}

export interface TranscribeRequest {
  images: string[];
}
export type TranscribeResponse = Transcription;

export type HintStage = 1 | 2 | 3 | 5 | 6;
export interface HintRequest {
  problem: string;
  stage: HintStage;
}
export type HintResponse = SimpleWords | GivenWanted | SmallCases | MethodHint | Skeleton;
export interface HintResponseMap {
  1: SimpleWords;
  2: GivenWanted;
  3: SmallCases;
  5: MethodHint;
  6: Skeleton;
}

export interface NextHintRequest {
  problem: string;
  /** The student's confirmed current work (from their latest photo); empty if they have nothing yet. */
  progress: SolutionStep[];
  /** Their work at the previous tip, to tell whether they got further. */
  previousProgress: SolutionStep[];
  /** Optional words from the student, e.g. where they are stuck. */
  note: string;
  /** Tips given so far, oldest first. */
  history: { hint: string; level: number }[];
}
export type NextHintResponse = NextHint;

export interface RecognizeRequest {
  problem: string;
  images: string[];
  /** Unfinished work photographed during the tip loop (scratch work allowed). */
  partial?: boolean;
  /** Set when the student submits their own version of an alternative approach. */
  intendedIdea?: string;
}
export type RecognizeResponse = Recognition;

export interface EvaluateRequest {
  problem: string;
  steps: SolutionStep[];
  intendedIdea?: string;
}
export interface EvaluatedStep extends FirstPassStep {
  /** Independent attempt to refute a gap/error critique; null for steps rated valid/unclear. */
  refutation: Refutation | null;
}
export interface EvaluateResponse extends Omit<Evaluation, 'steps'> {
  steps: EvaluatedStep[];
}

export interface DiscussRequest {
  problem: string;
  steps: SolutionStep[];
  stepId: string;
  critique: { status: StepStatusValue; reason: string; quote: string; evidence: string };
  history: ChatTurn[];
}
export type DiscussResponse = DiscussReply;

export type AskContext =
  | { kind: 'image'; crop: string; fullImage: string }
  | { kind: 'text'; marked: SolutionStep[]; solution: SolutionStep[] };
export interface AskRequest {
  problem: string;
  context: AskContext;
  question: string;
  history: ChatTurn[];
  /** The student's confirmed steps, if available, for context. */
  studentSteps?: SolutionStep[];
}
export type AskResponse = AskReply;

export interface CorrectRequest {
  problem: string;
  steps: SolutionStep[];
  /** Final (verified) verdicts per step. */
  verdicts: { stepId: string; status: StepStatusValue; reason: string }[];
}
export type CorrectResponse = Correction;

export interface ProposeRequest {
  problem: string;
  steps: SolutionStep[];
}
export type ProposeResponse = { ideas: Idea[] };

export interface DevelopRequest {
  problem: string;
  idea: Idea;
}
export interface DevelopResponse {
  solution: Solution;
  verification: Verification;
  /** True when the first solution was flawed and a repaired version was verified instead. */
  repaired: boolean;
}

export interface ChallengeRequest {
  problem: string;
  solution: SolutionStep[];
  stepId: string;
  concern: string;
}
export type ChallengeResponse = Challenge;

export interface ApiError {
  error: string;
  detail?: string;
}
