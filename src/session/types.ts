// Client-side data model (spec: Problem, Hints, Attempt, Annotation, Correction, Alternative).
// One Session holds everything for one problem and is stored locally in IndexedDB.
import type { ChatTurn, DevelopResponse, EvaluateResponse, SolutionStep } from '../../shared/api';
import type { CheckOutcome, Table } from '../../shared/codecheck';
import type {
  Challenge,
  ConjectureFeedback,
  CorrectionApproach,
  GivenWanted,
  Idea,
  MethodHint,
  SimpleWords,
  Skeleton,
  SmallCases,
  StepStatusValue,
} from '../../shared/schemas';
import type { DiscussionOutcome, FinalVerdict } from '../../shared/verdict';

export interface Problem {
  images: string[];
  transcript: string;
  /** Words describing the figure in the image (geometry); confirmed by the student like the text. */
  figure?: string;
  topic: string;
  uncertain: string[];
  confirmed: boolean;
}

/** Result of running a model-written check in the sandbox. */
export interface CheckRun {
  claim: string;
  code: string;
  source: 'evaluation' | 'discussion' | 'conjecture' | 'solver' | 'verifier' | 'challenge';
  outcome: CheckOutcome;
}

export interface Hints {
  /** Highest revealed stage, 0 = none. Stages are revealed in order. */
  revealed: number;
  simple?: SimpleWords;
  givenWanted?: GivenWanted;
  smallCases?: SmallCases & { table?: Table; tableError?: string };
  conjecture?: { text: string; feedback?: ConjectureFeedback; check?: CheckRun };
  method?: MethodHint;
  skeleton?: Skeleton;
}

export interface StepReview {
  stepId: string;
  /** First-pass critique plus independent refutation, as returned by the server. */
  evaluated: EvaluateResponse['steps'][number];
  check?: CheckRun;
  /** Verdict after refutation and code check (before discussion). */
  verified: FinalVerdict;
  discussion: ChatTurn[];
  discussionOutcome?: DiscussionOutcome;
  openPoint?: string;
}

export interface Assessment {
  score: number;
  summary: string;
  ideaUsed?: string;
  ideaComment?: string;
  steps: StepReview[];
}

export interface Annotation {
  id: string;
  page: number;
  /** Stroke in natural image pixel coordinates. */
  stroke: { x: number; y: number }[];
  bbox: { x: number; y: number; w: number; h: number };
  crop: string;
  messages: ChatTurn[];
}

export interface Attempt {
  id: string;
  images: string[];
  steps: SolutionStep[];
  unreadable: string[];
  /** Steps the recognizer was unsure about (ids). */
  unclearSteps: string[];
  recognized: boolean;
  confirmed: boolean;
  assessment?: Assessment;
  annotations: Annotation[];
  /** For own versions of an alternative approach. */
  intendedIdea?: string;
}

export interface Correction {
  approaches: CorrectionApproach[];
  /** How many fix-hint levels are revealed per approach. */
  revealed: number[];
}

export interface StepThread {
  id: string;
  stepIds: string[];
  messages: ChatTurn[];
}

export interface Alternative {
  id: string;
  idea: Idea;
  state: 'idle' | 'developing' | 'checking' | 'done' | 'failed';
  error?: string;
  developed?: DevelopResponse;
  checks: CheckRun[];
  expanded: boolean;
  threads: StepThread[];
  challenges: Record<string, { concern: string; result: Challenge; check?: CheckRun; final: 'step_valid' | 'step_flawed' | 'unclear' }>;
  ownAttempt?: Attempt;
}

export interface Session {
  id: string;
  createdAt: number;
  updatedAt: number;
  problem: Problem | null;
  hints: Hints;
  attempt: Attempt | null;
  pastAttempts: Attempt[];
  correction: Correction | null;
  alternatives: Alternative[] | null;
}

export type { StepStatusValue };
