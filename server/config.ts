import { existsSync } from 'node:fs';

export interface Config {
  provider: 'meta' | 'mock';
  apiKey: string;
  baseUrl: string;
  models: { fast: string; solver: string; verifier: string };
  jsonMode: boolean;
  timeoutMs: number;
  mockLatencyMs: number;
  port: number;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const apiKey = env.MODEL_API_KEY?.trim() ?? '';
  const requested = (env.MODEL_PROVIDER ?? 'auto').trim().toLowerCase();
  if (!['auto', 'meta', 'mock'].includes(requested)) {
    throw new Error(`MODEL_PROVIDER must be auto, meta or mock (got "${requested}")`);
  }
  const provider = requested === 'auto' ? (apiKey ? 'meta' : 'mock') : (requested as 'meta' | 'mock');
  if (provider === 'meta' && !apiKey) {
    throw new Error('MODEL_PROVIDER=meta needs MODEL_API_KEY');
  }
  const fast = env.MODEL_FAST?.trim() || 'muse-spark-1.3';
  const strong = env.MODEL_STRONG?.trim() || fast;
  return {
    provider,
    apiKey,
    baseUrl: (env.MODEL_BASE_URL?.trim() || 'https://api.meta.ai/v1').replace(/\/+$/, ''),
    models: {
      fast,
      solver: env.MODEL_SOLVER?.trim() || fast,
      verifier: env.MODEL_VERIFIER?.trim() || strong,
    },
    jsonMode: (env.MODEL_JSON_MODE ?? 'true').trim().toLowerCase() !== 'false',
    timeoutMs: Number(env.MODEL_TIMEOUT_MS) || 120_000,
    mockLatencyMs: env.MOCK_LATENCY_MS === undefined ? 500 : Number(env.MOCK_LATENCY_MS) || 0,
    port: Number(env.PORT) || 8787,
  };
}

/** Loads .env into process.env (existing variables win). */
export function loadDotEnv(path = '.env'): void {
  if (existsSync(path)) process.loadEnvFile(path);
}
