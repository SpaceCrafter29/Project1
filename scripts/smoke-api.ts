// Checks the real Meta API with the sample images: every call must return valid JSON
// in the expected format. Needs MODEL_API_KEY in .env. Run: npm run smoke:api
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Coach } from '../server/coach';
import { loadConfig, loadDotEnv } from '../server/config';
import { OpenAICompatibleProvider } from '../server/llm/openaiCompatible';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
loadDotEnv(path.join(root, '.env'));
const config = loadConfig();
if (config.provider !== 'meta') {
  console.error('No MODEL_API_KEY configured – put it into .env first (see .env.example).');
  process.exit(1);
}

const image = (name: string) =>
  `data:image/png;base64,${readFileSync(path.join(root, 'public/samples', name)).toString('base64')}`;

const coach = new Coach(
  new OpenAICompatibleProvider({ baseUrl: config.baseUrl, apiKey: config.apiKey, jsonMode: config.jsonMode, timeoutMs: config.timeoutMs }),
  config.models,
);

async function step<T>(name: string, fn: () => Promise<T>): Promise<T | undefined> {
  const started = Date.now();
  try {
    const result = await fn();
    console.log(`✓ ${name} (${((Date.now() - started) / 1000).toFixed(1)} s)`);
    console.log(JSON.stringify(result, null, 2).slice(0, 1200), '\n');
    return result;
  } catch (err) {
    console.log(`✗ ${name}: ${(err as Error).message}\n`);
    process.exitCode = 1;
    return undefined;
  }
}

console.log(`Meta API at ${config.baseUrl}, models ${JSON.stringify(config.models)}\n`);
const transcript = await step('transcribe sample problem', () => coach.transcribe({ images: [image('problem.png')] }));
const problem = transcript?.text ?? '';
if (problem) {
  await step('hint stage 1', () => coach.hint({ problem, stage: 1 }));
  await step('hint stage 3 (small cases code)', () => coach.hint({ problem, stage: 3 }));
  const recognized = await step('recognize handwritten solution', () => coach.recognize({ problem, images: [image('solution.png')] }));
  if (recognized) {
    const steps = recognized.steps.map((s, i) => ({ id: `s${i + 1}`, text: s.text }));
    await step('evaluate with independent refutations', () => coach.evaluate({ problem, steps }));
  }
}
console.log('Usage:', coach.usage.snapshot());
