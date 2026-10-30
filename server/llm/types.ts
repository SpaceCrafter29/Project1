export type ContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } };

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | ContentPart[];
}

/** Every call names its task so providers (and the mock) know what is being asked. */
export type Task =
  | 'transcribe'
  | 'hint.1'
  | 'hint.2'
  | 'hint.3'
  | 'hint.5'
  | 'hint.6'
  | 'nexthint'
  | 'recognize'
  | 'evaluate'
  | 'refute'
  | 'discuss'
  | 'ask'
  | 'correct'
  | 'propose'
  | 'solve'
  | 'verify'
  | 'challenge';

export interface CompletionRequest {
  task: Task;
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  /** The structured input the prompt was built from. Only the mock provider reads it. */
  input?: unknown;
}

export interface CompletionResult {
  text: string;
  usage?: { promptTokens: number; completionTokens: number };
}

export interface LLMProvider {
  readonly name: 'meta' | 'mock';
  complete(req: CompletionRequest): Promise<CompletionResult>;
}
