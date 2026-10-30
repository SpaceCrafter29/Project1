// Renders the demo images in public/samples: a problem "screenshot" and two
// handwritten-looking solution pages. Run with: npm run samples
import katex from 'katex';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'public', 'samples');
const katexCss = pathToFileURL(path.join(root, 'node_modules/katex/dist/katex.min.css')).href;
const caveat = pathToFileURL(path.join(root, 'node_modules/@fontsource/caveat/files/caveat-latin-400-normal.woff2')).href;

const tex = (s: string) => katex.renderToString(s, { throwOnError: false });

const problemHtml = `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="${katexCss}">
<style>
  body { margin: 0; background: #fff; font-family: 'Liberation Serif', 'DejaVu Serif', serif; color: #111; }
  .page { width: 900px; padding: 48px 56px; }
  .head { display: flex; justify-content: space-between; border-bottom: 2px solid #111; padding-bottom: 8px; margin-bottom: 24px; font-size: 18px; }
  h1 { font-size: 26px; margin: 0 0 18px; }
  p { font-size: 22px; line-height: 1.6; margin: 0 0 14px; }
</style></head><body><div class="page">
  <div class="head"><span>6th International Mathematical Olympiad</span><span>Moscow, 1964</span></div>
  <h1>Problem 1</h1>
  <p>(a) Find all positive integers ${tex('n')} for which ${tex('2^n - 1')} is divisible by ${tex('7')}.</p>
  <p>(b) Prove that there is no positive integer ${tex('n')} for which ${tex('2^n + 1')} is divisible by ${tex('7')}.</p>
</div></body></html>`;

function handwritten(lines: string[]): string {
  const rows = lines
    .map((line, i) => {
      const tilt = ((i * 37) % 7) / 10 - 0.3;
      const indent = 8 + ((i * 53) % 5) * 4;
      return `<div class="line" style="transform: rotate(${tilt}deg); margin-left: ${indent}px">${line}</div>`;
    })
    .join('\n');
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  @font-face { font-family: 'Caveat'; src: url('${caveat}') format('woff2'); }
  body { margin: 0; background: #fdfcf7; }
  .page {
    width: 1000px; padding: 40px 48px 56px 96px; position: relative;
    background-image: linear-gradient(#d7e3f4 1px, transparent 1px);
    background-size: 100% 54px; background-position: 0 30px;
    font-family: 'Caveat', cursive; font-size: 36px; color: #1d3c8f; line-height: 54px;
  }
  .page::before { content: ''; position: absolute; left: 72px; top: 0; bottom: 0; width: 2px; background: #f0a3a3; }
  .line { white-space: nowrap; }
  sup { font-size: 0.65em; }
</style></head><body><div class="page">${rows}</div></body></html>`;
}

const solutionLines = [
  '(a) 2<sup>1</sup> = 2,  2<sup>2</sup> = 4,  2<sup>3</sup> = 8 ≡ 1 (mod 7).',
  'So the remainders of 2<sup>n</sup> modulo 7 repeat with period 3:',
  '&nbsp;&nbsp;&nbsp;2, 4, 1, 2, 4, 1, …',
  'Hence 7 | 2<sup>n</sup> − 1 exactly when n is a multiple of 3.',
  'Answer (a): n = 3k.',
  '(b) 7 | 2<sup>n</sup> + 1 would mean 2<sup>n</sup> ≡ 6 (mod 7).',
  'But 2<sup>n</sup> + 1 is always odd, and an odd number',
  'cannot be divisible by 7.',
  'So there is no such n. &nbsp;□',
];

const ownVersionLines = [
  'Let n = 3q + r with r ∈ {0, 1, 2}.',
  '2<sup>3</sup> = 8 ≡ 1 (mod 7), so 2<sup>n</sup> = 8<sup>q</sup> · 2<sup>r</sup> ≡ 2<sup>r</sup> (mod 7).',
  '2<sup>r</sup> ∈ {1, 2, 4}, and it is 1 only for r = 0.',
  'So (a): 7 | 2<sup>n</sup> − 1 ⟺ 3 | n.',
  '(b) 2<sup>n</sup> + 1 ≡ 2<sup>r</sup> + 1 ∈ {2, 3, 5} (mod 7), never 0.',
  'So no n works. &nbsp;□',
];

async function main() {
  mkdirSync(out, { recursive: true });
  const work = mkdtempSync(path.join(tmpdir(), 'samples-'));
  const browser = await chromium.launch();
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  const pages: [string, string][] = [
    ['problem.png', problemHtml],
    ['solution.png', handwritten(solutionLines)],
    ['own-version.png', handwritten(ownVersionLines)],
  ];
  for (const [name, html] of pages) {
    const file = path.join(work, name.replace('.png', '.html'));
    writeFileSync(file, html);
    await page.goto(pathToFileURL(file).href);
    await page.evaluate(() => document.fonts.ready);
    await page.locator('.page').screenshot({ path: path.join(out, name) });
    console.log(`wrote public/samples/${name}`);
  }
  await browser.close();
}

await main();
