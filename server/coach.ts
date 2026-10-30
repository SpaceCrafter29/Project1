// The coaching service: one method per endpoint. Orchestrates the multi-call
// pipelines (evaluation + independent refutation, solve + verify + one repair).
import type {
  AskRequest,
  AskResponse,
  ChallengeRequest,
  ChallengeResponse,
  CorrectRequest,
  CorrectResponse,
  DevelopRequest,
  DevelopResponse,
  DiscussRequest,
  DiscussResponse,
  EvaluateRequest,
  EvaluateResponse,
  EvaluatedStep,
  HintRequest,
  HintResponse,
  NextHintRequest,
  NextHintResponse,
  ProposeRequest,
  ProposeResponse,
  RecognizeRequest,
  RecognizeResponse,
  SolutionStep,
  TranscribeRequest,
  TranscribeResponse,
  Usage,
} from '../shared/api';
import {
  AskReplySchema,
  ChallengeSchema,
  CorrectionSchema,
  DiscussReplySchema,
  EvaluationSchema,
  GivenWantedSchema,
  IdeasSchema,
  MethodHintSchema,
  NextHintSchema,
  RecognitionSchema,
  RefutationSchema,
  SimpleWordsSchema,
  SkeletonSchema,
  SmallCasesSchema,
  SolutionSchema,
  TranscriptionSchema,
  VerificationSchema,
  type FirstPassStep,
  type Refutation,
} from '../shared/schemas';
import type { z } from 'zod';
import { callJson, type UsageSink } from './llm/json';
import type { CompletionRequest, LLMProvider } from './llm/types';
import { evaluatePrompt, discussPrompt, recognizePrompt, refutePrompt } from './prompts/attempt';
import { askPrompt, challengePrompt, correctPrompt, proposePrompt, solvePrompt, verifyPrompt } from './prompts/coaching';
import type { Models } from './prompts/common';
import { hintPrompt, nextHintPrompt, transcribePrompt } from './prompts/problem';

export class UsageTracker implements UsageSink {
  private totals: Usage = { calls: 0, promptTokens: 0, completionTokens: 0 };

  record(usage: { promptTokens: number; completionTokens: number } | undefined): void {
    this.totals.calls += 1;
    this.totals.promptTokens += usage?.promptTokens ?? 0;
    this.totals.completionTokens += usage?.completionTokens ?? 0;
  }

  snapshot(): Usage {
    return { ...this.totals };
  }
}

const HINT_SCHEMAS = {
  1: SimpleWordsSchema,
  2: GivenWantedSchema,
  3: SmallCasesSchema,
  5: MethodHintSchema,
  6: SkeletonSchema,
} as const;

/** Maps the model's step references ("s2", "[s2]", "2", "Step 2") onto the confirmed step ids. */
export function resolveStepId(ref: string, steps: SolutionStep[]): string | null {
  const clean = ref.replace(/[[\]()]/g, '').trim().toLowerCase();
  const exact = steps.find((s) => s.id.toLowerCase() === clean);
  if (exact) return exact.id;
  const num = clean.match(/(\d+)\s*$/);
  if (num) {
    const byIndex = steps[Number(num[1]) - 1];
    if (byIndex) return byIndex.id;
  }
  return null;
}

export class Coach {
  constructor(
    private readonly provider: LLMProvider,
    private readonly models: Models,
    readonly usage = new UsageTracker(),
  ) {}

  private call<S extends z.ZodType>(req: CompletionRequest, schema: S): Promise<z.output<S>> {
    return callJson(this.provider, req, schema, this.usage);
  }

  transcribe(req: TranscribeRequest): Promise<TranscribeResponse> {
    return this.call(transcribePrompt(req, this.models), TranscriptionSchema);
  }

  hint(req: HintRequest): Promise<HintResponse> {
    return this.call(hintPrompt(req.problem, req.stage, this.models), HINT_SCHEMAS[req.stage]);
  }

  /** One personalized tip for the student's photographed progress. */
  async nextHint(req: NextHintRequest): Promise<NextHintResponse> {
    const hint = await this.call(nextHintPrompt(req, this.models), NextHintSchema);
    return { ...hint, focus_step: hint.focus_step ? resolveStepId(hint.focus_step, req.progress) : null };
  }

  recognize(req: RecognizeRequest): Promise<RecognizeResponse> {
    return this.call(recognizePrompt(req, this.models), RecognitionSchema);
  }

  /** First-pass evaluation, then an independent refutation attempt for every gap/error. */
  async evaluate(req: EvaluateRequest): Promise<EvaluateResponse> {
    const evaluation = await this.call(evaluatePrompt(req, this.models), EvaluationSchema);

    const byId = new Map<string, FirstPassStep>();
    for (const entry of evaluation.steps) {
      const id = resolveStepId(entry.step, req.steps);
      if (id && !byId.has(id)) byId.set(id, { ...entry, step: id });
    }
    const firstPass = req.steps.map(
      (s): FirstPassStep =>
        byId.get(s.id) ?? {
          step: s.id,
          status: 'unclear',
          quote: '',
          reason: 'The coach did not evaluate this step. Please check it yourself or ask about it.',
          evidence: '',
          deduction: 0,
          check_code: null,
          check_claim: '',
        },
    );

    const steps: EvaluatedStep[] = await Promise.all(
      firstPass.map(async (critique) => {
        if (critique.status !== 'gap' && critique.status !== 'error') return { ...critique, refutation: null };
        let refutation: Refutation | null = null;
        try {
          refutation = await this.call(
            refutePrompt({ problem: req.problem, steps: req.steps, critique }, this.models),
            RefutationSchema,
          );
        } catch {
          refutation = null; // without an independent check the critique is shown as "unclear"
        }
        return { ...critique, refutation };
      }),
    );
    return { ...evaluation, steps };
  }

  discuss(req: DiscussRequest): Promise<DiscussResponse> {
    return this.call(discussPrompt(req, this.models), DiscussReplySchema);
  }

  ask(req: AskRequest): Promise<AskResponse> {
    return this.call(askPrompt(req, this.models), AskReplySchema);
  }

  async correct(req: CorrectRequest): Promise<CorrectResponse> {
    const result = await this.call(correctPrompt(req, this.models), CorrectionSchema);
    return {
      approaches: result.approaches.map((a) => ({
        ...a,
        fails_at: a.fails_at ? resolveStepId(a.fails_at, req.steps) : null,
      })),
    };
  }

  propose(req: ProposeRequest): Promise<ProposeResponse> {
    return this.call(proposePrompt(req, this.models), IdeasSchema);
  }

  /** Solve along one idea, verify independently, and repair once if the verifier finds a flaw. */
  async develop(req: DevelopRequest): Promise<DevelopResponse> {
    let solution = await this.call(solvePrompt({ problem: req.problem, idea: req.idea }, this.models), SolutionSchema);
    let verification = await this.call(verifyPrompt({ problem: req.problem, solution }, this.models), VerificationSchema);
    if (verification.overall !== 'flawed') return { solution, verification, repaired: false };

    const issues =
      verification.issues_summary ||
      verification.steps
        .filter((s) => s.follows !== 'yes')
        .map((s) => `${s.id}: ${s.comment || s.hidden_assumptions}`)
        .join('; ');
    solution = await this.call(
      solvePrompt({ problem: req.problem, idea: req.idea, repair: { previous: solution, issues } }, this.models),
      SolutionSchema,
    );
    verification = await this.call(verifyPrompt({ problem: req.problem, solution }, this.models), VerificationSchema);
    return { solution, verification, repaired: true };
  }

  challenge(req: ChallengeRequest): Promise<ChallengeResponse> {
    return this.call(challengePrompt(req, this.models), ChallengeSchema);
  }
}
