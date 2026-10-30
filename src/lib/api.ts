import type {
  ApiError,
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
  HintResponseMap,
  NextHintRequest,
  NextHintResponse,
  ProposeRequest,
  ProposeResponse,
  RecognizeRequest,
  RecognizeResponse,
  ServerConfig,
  TranscribeRequest,
  TranscribeResponse,
  Usage,
} from '../../shared/api';

/** Fired after every model-backed request, e.g. to refresh the usage counter. */
export const API_CALL_EVENT = 'coach:api-call';

export class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly detail?: string,
  ) {
    super(message);
  }
}

/** True in the single-file demo build, which has no server. */
export const STANDALONE = import.meta.env.VITE_STANDALONE === 'true';

async function request<T>(path: string, body?: unknown): Promise<T> {
  if (STANDALONE) {
    const { localRequest } = await import('./localServer');
    if (body !== undefined) window.dispatchEvent(new Event(API_CALL_EVENT));
    try {
      return (await localRequest(path, body)) as T;
    } catch (err) {
      throw new ApiRequestError((err as Error).message);
    }
  }
  let res: Response;
  try {
    res = await fetch(`/api/${path}`, {
      method: body === undefined ? 'GET' : 'POST',
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiRequestError('The coach server is not reachable. Is it running?');
  }
  if (body !== undefined) window.dispatchEvent(new Event(API_CALL_EVENT));
  const data = (await res.json().catch(() => ({}))) as T & Partial<ApiError>;
  if (!res.ok) throw new ApiRequestError(data.error ?? `Request failed (${res.status})`, data.detail);
  return data;
}

export const api = {
  config: () => request<ServerConfig>('config'),
  usage: () => request<Usage>('usage'),
  transcribe: (b: TranscribeRequest) => request<TranscribeResponse>('transcribe', b),
  hint: <S extends keyof HintResponseMap>(problem: string, stage: S) =>
    request<HintResponseMap[S]>('hint', { problem, stage }),
  nextHint: (b: NextHintRequest) => request<NextHintResponse>('nexthint', b),
  recognize: (b: RecognizeRequest) => request<RecognizeResponse>('recognize', b),
  evaluate: (b: EvaluateRequest) => request<EvaluateResponse>('evaluate', b),
  discuss: (b: DiscussRequest) => request<DiscussResponse>('discuss', b),
  ask: (b: AskRequest) => request<AskResponse>('ask', b),
  correct: (b: CorrectRequest) => request<CorrectResponse>('correct', b),
  propose: (b: ProposeRequest) => request<ProposeResponse>('propose', b),
  develop: (b: DevelopRequest) => request<DevelopResponse>('develop', b),
  challenge: (b: ChallengeRequest) => request<ChallengeResponse>('challenge', b),
};

export function errorMessage(err: unknown): string {
  if (err instanceof ApiRequestError) return err.message;
  return (err as Error)?.message ?? 'Unknown error';
}
