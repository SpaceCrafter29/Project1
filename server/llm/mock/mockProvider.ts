// Demo-mode provider: answers every task with scripted, schema-valid JSON so the whole
// app can be used and tested without an API key. It reads the structured `input`
// of each request instead of the prompt text, and picks one of the demo scripts.
import type {
  AskRequest,
  ChallengeRequest,
  DiscussRequest,
  EvaluateRequest,
  NextHintRequest,
  RecognizeRequest,
  SolutionStep,
  TranscribeRequest,
} from '../../../shared/api';
import type { Evaluation, FirstPassStep, StepBox } from '../../../shared/schemas';
import type { RefuteInput } from '../../prompts/attempt';
import type { SolveInput, VerifyInput } from '../../prompts/coaching';
import type { CompletionRequest, CompletionResult, LLMProvider } from '../types';
import sampleLayout from './sampleLayout.json';
import { geometry } from './scripts/geometry';
import { numberTheory } from './scripts/numberTheory';
import { S, type DemoScript } from './scripts/types';

const SCRIPTS = [numberTheory, geometry];
const squash = (s: string) => s.replace(/\s+/g, ' ').trim();

function scriptFor(problem: string | undefined): DemoScript {
  return SCRIPTS.find((s) => problem && s.matches(problem)) ?? numberTheory;
}

/** Width/height of a PNG or JPEG data URL, without decoding the image (works in Node and browsers). */
export function imageSize(dataUrl: string): { width: number; height: number } | null {
  const binary = atob(dataUrl.slice(dataUrl.indexOf(',') + 1));
  const bytes = new DataView(Uint8Array.from(binary, (c) => c.charCodeAt(0)).buffer);
  if (bytes.byteLength >= 24 && bytes.getUint32(0) === 0x89504e47) {
    return { width: bytes.getUint32(16), height: bytes.getUint32(20) };
  }
  for (let i = 2; i + 9 < bytes.byteLength; ) {
    if (bytes.getUint8(i) !== 0xff) return null;
    const marker = bytes.getUint8(i + 1);
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      return { width: bytes.getUint16(i + 7), height: bytes.getUint16(i + 5) };
    }
    i += 2 + bytes.getUint16(i + 2);
  }
  return null;
}

/**
 * The demo cannot read images. Wide screenshots get the number theory demo, anything
 * taller (like a problem with a figure, or a phone photo) the geometry demo.
 */
function scriptForImage(images: string[]): DemoScript {
  const size = images[0] ? imageSize(images[0]) : null;
  return size && size.width / size.height < 2.2 ? geometry : numberTheory;
}

export class MockProvider implements LLMProvider {
  readonly name = 'mock' as const;

  constructor(private readonly latencyMs = 500) {}

  async complete(req: CompletionRequest): Promise<CompletionResult> {
    const slow = req.task === 'solve' || req.task === 'verify' || req.task === 'evaluate' ? 2 : 1;
    if (this.latencyMs > 0) await new Promise((r) => setTimeout(r, this.latencyMs * slow));
    return { text: JSON.stringify(this.answer(req)), usage: { promptTokens: 0, completionTokens: 0 } };
  }

  private answer(req: CompletionRequest): unknown {
    if (req.task === 'transcribe') return scriptForImage((req.input as TranscribeRequest).images).transcription;
    const input = req.input as { problem?: string };
    const script = scriptFor(input.problem);
    switch (req.task) {
      case 'hint.1':
        return script.hints[1];
      case 'hint.2':
        return script.hints[2];
      case 'hint.3':
        return script.hints[3];
      case 'hint.5':
        return script.hints[5];
      case 'hint.6':
        return script.hints[6];
      case 'nexthint':
        return nextHint(script, req.input as NextHintRequest);
      case 'recognize': {
        const r = req.input as RecognizeRequest;
        if (r.partial) return { steps: script.progressSteps.map((text) => ({ text, unclear: false, box: null })), unreadable: [] };
        const own = !!r.intendedIdea;
        const boxes = stepBoxes(script, own, r.images);
        const steps = own ? script.ownVersionSteps : script.steps;
        return { steps: steps.map((text, i) => ({ text, unclear: false, box: boxes[i] ?? null })), unreadable: [] };
      }
      case 'evaluate':
        return evaluate(script, req.input as EvaluateRequest);
      case 'refute':
        return script.refute(req.input as RefuteInput);
      case 'discuss':
        return script.discuss(req.input as DiscussRequest);
      case 'ask':
        return ask(script, req.input as AskRequest);
      case 'correct': {
        const steps = (req.input as { steps: SolutionStep[] }).steps;
        return script.correct((i) => steps.find((s) => squash(s.text) === squash(script.steps[i] ?? ''))?.id ?? null);
      }
      case 'propose':
        return { ideas: script.ideas };
      case 'solve': {
        const i = script.ideas.findIndex((idea) => idea.principle === (req.input as SolveInput).idea.principle);
        return script.solutions[Math.max(0, i)];
      }
      case 'verify':
        return verify(script, req.input as VerifyInput);
      case 'challenge':
        return challenge(script, req.input as ChallengeRequest);
    }
  }
}

/** Escalates like the real prompt asks: one level more concrete when nothing changed. */
function nextHint(script: DemoScript, input: NextHintRequest) {
  const same =
    input.progress.length === input.previousProgress.length &&
    input.progress.every((s, i) => squash(s.text) === squash(input.previousProgress[i].text));
  const last = input.history[input.history.length - 1];
  const level = (last && same ? Math.min(3, last.level + 1) : 1) as 1 | 2 | 3;
  const later = input.part && input.part.label !== 'a';
  return later ? script.laterPartHint(input, level) : script.nextHint(input, level);
}

/** Every solution – including an own version with a new idea – is corrected on its own merits. */
function evaluate(script: DemoScript, input: EvaluateRequest): Evaluation {
  const own = input.steps.some((s) => script.ownVersionSteps.some((o) => squash(o) === squash(s.text)));
  const texts = own ? script.ownVersionSteps : script.steps;
  const verdicts = own ? script.ownVersion.verdicts : script.verdicts;
  const steps = input.steps.map((s): FirstPassStep => {
    const scripted = verdicts[texts.findIndex((d) => squash(d) === squash(s.text))];
    return scripted
      ? { ...scripted, step: s.id }
      : {
          step: s.id,
          status: 'valid',
          quote: '',
          reason: 'Follows from the previous steps. (Demo mode: unscripted step.)',
          evidence: '',
          deduction: 0,
          check_code: null,
          check_claim: '',
          wording: [],
          improve: '',
        };
  });
  if (own) {
    const { score, summary, strengths, improvements } = script.ownVersion;
    return { steps, score, summary, strengths, improvements };
  }
  const deductions = steps.reduce((sum, s) => sum + s.deduction, 0);
  return { steps, score: Math.max(0, 7 - deductions), summary: script.summary, strengths: script.strengths, improvements: script.improvements };
}

/**
 * Where the scripted steps are written on the sample photos, so the feedback can mark
 * them. Only for the sample photos themselves (recognized by their exact size).
 */
function stepBoxes(script: DemoScript, own: boolean, images: string[]): (StepBox | null)[] {
  const file = own ? script.layout.ownVersion : script.layout.solution;
  const lineGroups = own ? script.layout.ownVersionLines : script.layout.solutionLines;
  const layout = (sampleLayout as Record<string, { width: number; height: number; lines: Omit<StepBox, 'page'>[] }>)[file];
  const size = images[0] ? imageSize(images[0]) : null;
  if (!layout || !size || size.width !== layout.width || size.height !== layout.height) return lineGroups.map(() => null);
  // Slanted handwriting reaches past the measured line width, so more room left and right.
  const padX = 0.022;
  const padY = 0.012;
  return lineGroups.map((group) => {
    const lines = group.map((i) => layout.lines[i]);
    const x0 = Math.min(...lines.map((l) => l.x)) - padX;
    const y0 = Math.min(...lines.map((l) => l.y)) - padY;
    const x1 = Math.max(...lines.map((l) => l.x + l.w)) + padX;
    const y1 = Math.max(...lines.map((l) => l.y + l.h)) + padY;
    return { page: 0, x: Math.max(0, x0), y: Math.max(0, y0), w: Math.min(1, x1) - Math.max(0, x0), h: Math.min(1, y1) - Math.max(0, y0) };
  });
}

/** Finds a scripted solution step; the client may append "(because: …)" to the text. */
function solutionStep(script: DemoScript, text: string) {
  return script.solutions.flatMap((s) => s.steps).find((s) => text && squash(text).startsWith(squash(s.text)));
}

function ask(script: DemoScript, input: AskRequest) {
  const q = input.question.trim();
  const explain = !q || /^explain this/i.test(q);
  if (input.context.kind === 'image') return { answer: script.askImage(q, explain) };
  const marked = input.context.marked[0];
  const justification = solutionStep(script, marked?.text ?? '')?.justification;
  return {
    answer: justification
      ? S`Step ${marked.id}: ${justification} ${explain ? '' : S`About your question "${q}": the step only uses what is stated in the earlier steps, nothing else.`}`.trim()
      : 'This step summarizes the previous ones. (Demo mode sample answer.)',
  };
}

function verify(script: DemoScript, input: VerifyInput) {
  const i = script.solutions.findIndex((s) => s.steps[0]?.text === input.solution.steps[0]?.text);
  return {
    overall: 'valid',
    steps: input.solution.steps.map((s) => ({ id: s.id, follows: 'yes', hidden_assumptions: '', comment: '' })),
    issues_summary: '',
    checks: script.verifierChecks[i] ?? [],
  };
}

function challenge(script: DemoScript, input: ChallengeRequest) {
  const step = input.solution.find((s) => s.id === input.stepId);
  const justification = solutionStep(script, step?.text ?? '')?.justification;
  const check = script.challengeCheck(step?.text ?? '');
  return {
    verdict: 'step_valid',
    explanation: `I re-checked step ${input.stepId} from scratch. ${justification ?? 'It follows from the previous steps.'} Your doubt is reasonable to check, but the step holds.`,
    check_code: check?.code ?? null,
    check_claim: check?.claim ?? '',
  };
}
