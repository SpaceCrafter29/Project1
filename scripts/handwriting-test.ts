// How well does the model read handwriting with formulas? Put 3–5 photos of real
// handwritten solutions into handwriting-samples/ (optionally with a <name>.txt
// containing what is actually written), then run: npm run handwriting-test
// Writes handwriting-report/report.md with the recognized steps next to each photo.
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
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

const input = path.resolve(process.argv[2] ?? path.join(root, 'handwriting-samples'));
const output = path.join(root, 'handwriting-report');
const problem = process.argv[3] ?? 'Unknown olympiad problem – transcribe the solution as written.';
const MIME: Record<string, string> = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' };

if (!existsSync(input)) {
  console.error(`Folder not found: ${input}`);
  process.exit(1);
}
const files = readdirSync(input).filter((f) => MIME[path.extname(f).toLowerCase()]);
if (files.length === 0) {
  console.error(`No .png/.jpg/.webp images in ${input}`);
  process.exit(1);
}
mkdirSync(output, { recursive: true });

/** Character-level similarity in [0, 1] after normalizing whitespace and LaTeX markers. */
function similarity(a: string, b: string): number {
  const norm = (s: string) => s.toLowerCase().replace(/[$\s{}\\]/g, '');
  const x = norm(a);
  const y = norm(b);
  if (!x.length && !y.length) return 1;
  let prev = Array.from({ length: y.length + 1 }, (_, j) => j);
  for (let i = 1; i <= x.length; i++) {
    const cur = [i];
    for (let j = 1; j <= y.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (x[i - 1] === y[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return 1 - prev[y.length] / Math.max(x.length, y.length);
}

const coach = new Coach(
  new OpenAICompatibleProvider({ baseUrl: config.baseUrl, apiKey: config.apiKey, jsonMode: config.jsonMode, timeoutMs: config.timeoutMs }),
  config.models,
);

let report = `# Handwriting recognition test\n\nModel: \`${config.models.fast}\` · ${new Date().toISOString()}\n\n`;
for (const file of files) {
  const data = readFileSync(path.join(input, file));
  const url = `data:${MIME[path.extname(file).toLowerCase()]};base64,${data.toString('base64')}`;
  copyFileSync(path.join(input, file), path.join(output, file));
  const started = Date.now();
  report += `## ${file}\n\n<img src="${file}" width="480">\n\n`;
  try {
    const result = await coach.recognize({ problem, images: [url] });
    const seconds = ((Date.now() - started) / 1000).toFixed(1);
    const recognized = result.steps.map((s) => s.text).join('\n');
    report += `Read in ${seconds} s. Steps marked unclear by the model: ${result.steps.filter((s) => s.unclear).length}.\n\n`;
    report += result.steps.map((s, i) => `${i + 1}. ${s.unclear ? '⚠️ ' : ''}${s.text}`).join('\n') + '\n\n';
    if (result.unreadable.length) report += `Unreadable: ${result.unreadable.join(' · ')}\n\n`;
    const truthFile = path.join(input, `${path.parse(file).name}.txt`);
    if (existsSync(truthFile)) {
      const score = similarity(recognized, readFileSync(truthFile, 'utf8'));
      report += `**Similarity to ${path.basename(truthFile)}: ${(score * 100).toFixed(0)} %**\n\n`;
    }
    console.log(`✓ ${file} (${seconds} s, ${result.steps.length} steps)`);
  } catch (err) {
    report += `**Failed:** ${(err as Error).message}\n\n`;
    console.log(`✗ ${file}: ${(err as Error).message}`);
  }
}
writeFileSync(path.join(output, 'report.md'), report);
console.log(`\nReport: ${path.join(output, 'report.md')}`);
