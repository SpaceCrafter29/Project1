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

const geometryProblemHtml = `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="${katexCss}">
<style>
  body { margin: 0; background: #fff; font-family: 'Liberation Serif', 'DejaVu Serif', serif; color: #111; }
  .page { width: 900px; padding: 40px 56px; }
  .head { display: flex; justify-content: space-between; border-bottom: 2px solid #111; padding-bottom: 8px; margin-bottom: 20px; font-size: 18px; }
  p { font-size: 21px; line-height: 1.55; margin: 0 0 10px; }
  svg { display: block; margin: 12px auto 0; }
  svg text { font: italic 20px 'Liberation Serif', serif; }
</style></head><body><div class="page">
  <div class="head"><span>Training sheet · Geometry</span><span>Problem 4</span></div>
  <p>Let ${tex('ABCD')} be a convex quadrilateral, and let ${tex('M')}, ${tex('N')}, ${tex('P')}, ${tex('Q')} be the midpoints of the sides ${tex('AB')}, ${tex('BC')}, ${tex('CD')}, ${tex('DA')}.</p>
  <p>(a) Prove that ${tex('MNPQ')} is a parallelogram.</p>
  <p>(b) Prove that the area of ${tex('MNPQ')} is half the area of ${tex('ABCD')}.</p>
  <svg width="420" height="250" viewBox="0 0 420 250">
    <polygon points="40,210 330,230 390,40 120,20" fill="none" stroke="#111" stroke-width="2"/>
    <polygon points="185,220 360,135 255,30 80,115" fill="#e9e9e9" stroke="#111" stroke-width="1.5"/>
    <g stroke="#111" stroke-width="1.5">
      <line x1="110" y1="210" x2="112" y2="221"/><line x1="258" y1="219" x2="260" y2="230"/>
      <line x1="345" y1="182" x2="356" y2="186"/><line x1="370" y1="92" x2="381" y2="96"/>
      <line x1="323" y1="25" x2="321" y2="36"/><line x1="185" y1="20" x2="183" y2="31"/>
      <line x1="66" y1="158" x2="77" y2="162"/><line x1="94" y1="72" x2="105" y2="76"/>
    </g>
    <text x="18" y="225">A</text><text x="336" y="246">B</text><text x="396" y="40">C</text><text x="104" y="16">D</text>
    <text x="178" y="244">M</text><text x="370" y="142">N</text><text x="252" y="18">P</text><text x="58" y="118">Q</text>
  </svg>
</div></body></html>`;

function handwritten(lines: string[], sketch = ''): string {
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
  .sketch { position: absolute; right: 40px; top: 46px; }
</style></head><body><div class="page">${rows}${sketch}</div></body></html>`;
}

// A quick pen sketch of the quadrilateral with the diagonal AC, as students draw it.
const quadSketch = `<svg class="sketch" width="250" height="190" viewBox="0 0 250 190" fill="none" stroke="#1d3c8f" stroke-width="2.2" stroke-linecap="round">
  <path d="M20 160 Q100 168 190 172 Q210 110 232 32 Q150 22 70 14 Q45 90 20 160 Z"/>
  <path d="M20 160 L232 32" stroke-dasharray="7 6"/>
  <path d="M105 166 L211 102 L151 23 L45 87 Z" stroke-width="1.8"/>
  <g fill="#1d3c8f" stroke="none" font-family="Caveat" font-size="24">
    <text x="2" y="176">A</text><text x="192" y="190">B</text><text x="236" y="30">C</text><text x="50" y="24">D</text>
    <text x="98" y="188">M</text><text x="216" y="110">N</text><text x="146" y="18">P</text><text x="24" y="88">Q</text>
  </g>
</svg>`;

const geometrySolutionLines = [
  'Draw the diagonal AC.',
  'In △ABC, MN is a midline, so MN ∥ AC',
  '&nbsp;&nbsp;and MN = ½ AC.',
  'In △ACD, QP is a midline, so QP ∥ AC',
  '&nbsp;&nbsp;and QP = ½ AC.',
  'So MN ∥ QP and MN = QP, hence MNPQ is a parallelogram.',
  '(b) The area of MNPQ is MN · NP.',
  'MN · NP = ½AC · ½BD = ¼ AC·BD, and the area of ABCD',
  'is ½ AC·BD, so [MNPQ] = ½ [ABCD]. &nbsp;□',
];

const geometryOwnVersionLines = [
  'Let M = (A+B)/2, N = (B+C)/2, P = (C+D)/2, Q = (D+A)/2.',
  'Then N − M = (C−A)/2 = P − Q, so MN⃗ = QP⃗ → parallelogram.',
  'Also Q − M = (D−B)/2, so',
  '&nbsp;&nbsp;[MNPQ] = |(N−M) × (Q−M)| = ¼ |(C−A) × (D−B)|.',
  '[ABCD] = ½ |(C−A) × (D−B)|, hence [MNPQ] = ½ [ABCD]. &nbsp;□',
];

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
    ['geometry-problem.png', geometryProblemHtml],
    ['geometry-solution.png', handwritten(geometrySolutionLines, quadSketch)],
    ['geometry-own-version.png', handwritten(geometryOwnVersionLines)],
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
