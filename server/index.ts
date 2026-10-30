import express from 'express';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp } from './app';
import { Coach } from './coach';
import { loadConfig, loadDotEnv } from './config';
import { MockProvider } from './llm/mock/mockProvider';
import { OpenAICompatibleProvider } from './llm/openaiCompatible';
import type { LLMProvider } from './llm/types';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
loadDotEnv(path.join(root, '.env'));
const config = loadConfig();

const provider: LLMProvider =
  config.provider === 'meta'
    ? new OpenAICompatibleProvider({
        baseUrl: config.baseUrl,
        apiKey: config.apiKey,
        jsonMode: config.jsonMode,
        timeoutMs: config.timeoutMs,
      })
    : new MockProvider(config.mockLatencyMs);

const app = createApp(new Coach(provider, config.models), { provider: config.provider, models: config.models });

// Model-written check code runs in this worker: no network access and no external scripts.
app.use((req, res, next) => {
  if (req.path.includes('sandbox.worker')) {
    res.setHeader('Content-Security-Policy', "default-src 'none'; script-src 'self' 'unsafe-eval'");
  }
  next();
});

if (process.env.NODE_ENV === 'production') {
  const dist = path.join(root, 'dist');
  if (!existsSync(dist)) throw new Error('dist/ not found – run "npm run build" first');
  app.use(express.static(dist));
  app.get(/^(?!\/api\/).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')));
} else {
  const { createServer } = await import('vite');
  const vite = await createServer({ root, server: { middlewareMode: true }, appType: 'spa' });
  app.use(vite.middlewares);
}

app.listen(config.port, () => {
  const mode = config.provider === 'meta' ? `Meta API (${config.models.fast})` : 'demo mode (no API key, scripted answers)';
  console.log(`Olympiad Coach running on http://localhost:${config.port} – ${mode}`);
});
