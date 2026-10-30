// The standalone demo (one HTML file, no server) answers API requests right in the
// browser: same request validation, same coaching pipelines, demo provider.
import type { ServerConfig } from '../../shared/api';
import { Coach } from '../../server/coach';
import { MockProvider } from '../../server/llm/mock/mockProvider';
import { requestSchemas } from '../../server/requests';

const models = { fast: 'demo', solver: 'demo', verifier: 'demo' };
const coach = new Coach(new MockProvider(350), models);

type Endpoint = keyof typeof requestSchemas;

const handlers: { [K in Endpoint]: (body: never) => Promise<unknown> } = {
  transcribe: (b) => coach.transcribe(b),
  hint: (b) => coach.hint(b),
  nexthint: (b) => coach.nextHint(b),
  recognize: (b) => coach.recognize(b),
  evaluate: (b) => coach.evaluate(b),
  discuss: (b) => coach.discuss(b),
  ask: (b) => coach.ask(b),
  correct: (b) => coach.correct(b),
  propose: (b) => coach.propose(b),
  develop: (b) => coach.develop(b),
  challenge: (b) => coach.challenge(b),
};

export async function localRequest(path: string, body?: unknown): Promise<unknown> {
  if (path === 'config') return { provider: 'mock', models } satisfies ServerConfig;
  if (path === 'usage') return coach.usage.snapshot();
  const name = path as Endpoint;
  if (!(name in handlers)) throw new Error('Unknown API endpoint');
  const parsed = requestSchemas[name].safeParse(body);
  if (!parsed.success) throw new Error(`Invalid request: ${parsed.error.issues[0]?.message ?? ''}`);
  return handlers[name](parsed.data as never);
}
