import express, { type Express } from 'express';
import { ZodError } from 'zod';
import type { ApiError, ServerConfig } from '../shared/api';
import type { Coach } from './coach';
import { ModelOutputError } from './llm/json';
import { ProviderError } from './llm/openaiCompatible';
import { requestSchemas } from './requests';

type Endpoint = keyof typeof requestSchemas;

export function createApp(coach: Coach, info: ServerConfig): Express {
  const app = express();
  app.disable('x-powered-by');
  app.use('/api', express.json({ limit: '40mb' }));

  app.get('/api/config', (_req, res) => {
    res.json(info);
  });
  app.get('/api/usage', (_req, res) => {
    res.json(coach.usage.snapshot());
  });

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

  for (const name of Object.keys(handlers) as Endpoint[]) {
    app.post(`/api/${name}`, async (req, res) => {
      try {
        const body = requestSchemas[name].parse(req.body);
        res.json(await handlers[name](body as never));
      } catch (err) {
        const [status, payload] = toError(err);
        if (status >= 500) console.error(`[${name}]`, err);
        res.status(status).json(payload);
      }
    });
  }

  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'Unknown API endpoint' } satisfies ApiError);
  });
  return app;
}

function toError(err: unknown): [number, ApiError] {
  if (err instanceof ZodError) {
    return [400, { error: 'Invalid request', detail: err.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ') }];
  }
  if (err instanceof ModelOutputError) {
    return [502, { error: 'The model answered in an unexpected format. Please try again.', detail: err.message }];
  }
  if (err instanceof ProviderError) {
    return [502, { error: err.message }];
  }
  return [500, { error: 'Something went wrong on the server.', detail: (err as Error)?.message }];
}
