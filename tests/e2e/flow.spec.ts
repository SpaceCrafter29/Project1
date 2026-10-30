// End-to-end walk through every screen in demo mode (scripted model answers,
// real browser, real Web Worker code checks, real IndexedDB).
import { expect, test, type Locator, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const samples = path.resolve('public/samples');
const shots = path.resolve('docs/screenshots');
mkdirSync(shots, { recursive: true });

async function shot(page: Page, name: string) {
  await page.screenshot({ path: path.join(shots, `${name}.png`), fullPage: true });
}

/** Draws a closed loop around the given box (fractions of the element's size). */
async function circle(page: Page, target: Locator, box: { x0: number; y0: number; x1: number; y1: number }) {
  const r = (await target.boundingBox())!;
  const pts: [number, number][] = [];
  for (let i = 0; i <= 24; i++) {
    const t = (i / 24) * 2 * Math.PI;
    const cx = (box.x0 + box.x1) / 2;
    const cy = (box.y0 + box.y1) / 2;
    pts.push([r.x + r.width * (cx + ((box.x1 - box.x0) / 2) * Math.cos(t)), r.y + r.height * (cy + ((box.y1 - box.y0) / 2) * Math.sin(t))]);
  }
  await page.mouse.move(...pts[0]);
  await page.mouse.down();
  for (const p of pts.slice(1)) await page.mouse.move(...p, { steps: 2 });
  await page.mouse.up();
}

test('full coaching flow in demo mode', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto('/');
  await expect(page.getByTestId('demo-banner')).toBeVisible();
  await expect(page.getByTestId('disclaimer')).toHaveText(/The AI can make mistakes/);
  await shot(page, '01-home');
  await page.getByTestId('new-problem').click();

  // 1. Upload + transcription + confirmation
  await page.getByTestId('problem-images-file').setInputFiles(path.join(samples, 'problem.png'));
  await page.getByTestId('read-problem').click();
  await expect(page.getByTestId('confirm-problem')).toBeVisible();
  await expect(page.getByTestId('problem-text')).toHaveValue(/divisible by \$7\$/);
  await shot(page, '02-confirm-problem');
  await page.getByTestId('confirm-problem-btn').click();
  await expect(page).toHaveURL(/\/work$/);

  // 2. The tip loop: one tip first (here with a small-case table computed by code) …
  const tip1 = page.getByTestId('tip-1');
  await expect(tip1).toContainText('only care about the remainder');
  await expect(tip1.getByTestId('cases-table').locator('tbody tr')).toHaveCount(15);
  await expect(page.getByTestId('tip-2')).toHaveCount(0);

  // … then the student photographs their progress, confirms the reading, and gets a tip for exactly that.
  await page.getByTestId('progress-images-file').setInputFiles(path.join(samples, 'progress.png'));
  await page.getByTestId('read-progress').click();
  await expect(page.getByTestId('progress-confirm').locator('textarea')).toHaveCount(4);
  await page.getByTestId('next-tip').click();
  const tip2 = page.getByTestId('tip-2');
  await expect(tip2).toContainText('You computed the remainders');
  await expect(tip2).toContainText('A pattern in six values is not a proof yet');
  await expect(tip2).toContainText('a direction');
  await expect(tip2.getByTestId('check-result')).toContainText('Holds in all tested cases');
  await expect(tip2.locator('.tip-focus')).toContainText('Conjecture');

  // Still stuck at the same point: the next tip gets more concrete.
  await page.getByTestId('tip-note').fill('I still do not see why it repeats.');
  await page.getByTestId('tip-without-photo').click();
  const tip3 = page.getByTestId('tip-3');
  await expect(tip3).toContainText('more concrete');
  await expect(tip3).toContainText('What does multiplying by 8 do');
  await expect(tip3).toContainText('I still do not see why it repeats.');
  await shot(page, '03-tips');

  // 3./4. Solution photo + recognition confirmation
  await page.getByTestId('go-solve').click();
  await page.getByTestId('attempt-images-file').setInputFiles(path.join(samples, 'solution.png'));
  await page.getByTestId('read-solution').click();
  await expect(page.getByTestId('confirm-steps')).toBeVisible();
  await expect(page.getByTestId('step-text-6')).toBeVisible();
  await shot(page, '04-confirm-steps');
  await page.getByTestId('confirm-steps-btn').click();

  // 5. Verified step evaluation
  await expect(page.getByTestId('assessment')).toBeVisible();
  await expect(page.getByTestId('score')).toHaveText('3–4');
  await expect(page.getByTestId('review-1')).toContainText('valid');
  await expect(page.getByTestId('review-2')).toContainText('gap');
  await expect(page.getByTestId('review-2').getByTestId('check-result')).toContainText('Holds in all tested cases');
  // Critique withdrawn by the independent refutation -> unclear, not "error".
  await expect(page.getByTestId('review-3')).toContainText('unclear');
  await expect(page.getByTestId('review-5')).toContainText('error');
  await expect(page.getByTestId('review-5').getByTestId('check-result')).toContainText('Counterexample found');
  await expect(page.getByTestId('review-5')).toContainText(/Counterexample found\s*7 is odd and divisible by 7/);
  await shot(page, '05-feedback');

  // Discussion mode: the coach concedes step 3 -> valid, score rises.
  const review3 = page.getByTestId('review-3');
  await review3.getByTestId('disagree').click();
  await review3.locator('textarea').fill('Step 2 lists all remainders 2, 4, 1, so both directions follow.');
  await review3.getByRole('button', { name: 'Send' }).click();
  await expect(review3.locator('.chat-coach')).toContainText('You are right');
  await expect(review3.locator('.mark-label')).toHaveText('valid');
  await expect(page.getByTestId('score')).toHaveText('4');

  // Discussion with a code test: the coach maintains step 5 with a counterexample.
  const review5 = page.getByTestId('review-5');
  await review5.getByTestId('disagree').click();
  await review5.locator('textarea').fill('Odd numbers are never multiples of 7, I think.');
  await review5.getByRole('button', { name: 'Send' }).click();
  await expect(review5.locator('.chat-check')).toContainText('counterexample found');
  await expect(review5.locator('.chat-coach').last()).toContainText('The test settles it');
  await expect(review5.locator('.mark-label')).toHaveText('error');
  await shot(page, '06-discussion');

  // 6. Pen markings with their own chat
  await page.getByTestId('tab-ask').click();
  const canvas = page.getByTestId('pen-page-1').locator('canvas');
  await expect(canvas).toBeVisible();
  await circle(page, canvas, { x0: 0.08, y0: 0.17, x1: 0.7, y1: 0.36 });
  const annotation = page.getByTestId('annotation-1');
  await expect(annotation).toBeVisible();
  await expect(annotation.locator('img.crop')).toBeVisible();
  await annotation.getByRole('button', { name: 'Explain this' }).click();
  await expect(annotation.locator('.chat-coach')).toContainText('remainders');
  await circle(page, canvas, { x0: 0.08, y0: 0.68, x1: 0.6, y1: 0.82 });
  await expect(page.getByTestId('annotation-2')).toBeVisible();
  await shot(page, '07-pen');

  // 7. Correction of the student's own approach
  await page.getByTestId('tab-fix').click();
  await page.getByTestId('load-correction').click();
  await expect(page.getByTestId('approach-1')).toContainText('Partly');
  await expect(page.getByTestId('approach-2')).toContainText('No, not as it stands');
  await page.getByTestId('reveal-fix-2').click();
  await expect(page.getByTestId('approach-2')).toContainText('Direction');
  await page.getByTestId('reveal-fix-2').click();
  await expect(page.getByTestId('approach-2')).toContainText('Detail');
  await expect(page.getByTestId('reveal-fix-2')).toHaveCount(0);
  await shot(page, '08-fix');

  // 8. Alternatives: propose -> develop -> verify -> code checks -> consistency
  await page.getByTestId('tab-learn').click();
  await page.getByTestId('propose').click();
  const alts = page.getByTestId('alternative');
  await expect(alts).toHaveCount(3);
  await alts.nth(0).getByTestId('toggle-alternative').click();
  await expect(alts.nth(0).getByTestId('alternative-solution')).toBeVisible();
  await expect(alts.nth(0).getByTestId('unverified')).toHaveCount(0);
  await expect(alts.nth(0).getByTestId('logic-only')).toHaveCount(0);
  await alts.nth(1).getByTestId('toggle-alternative').click();
  await expect(alts.nth(1).getByTestId('logic-only')).toBeVisible();
  await alts.nth(2).getByTestId('toggle-alternative').click();
  await expect(alts.nth(2).getByTestId('alternative-discarded')).toBeVisible();
  await expect(alts.nth(2).getByTestId('alternative-solution')).toHaveCount(0);

  // Challenge a coach step ("That's not right?") -> re-checked with code
  const first = alts.nth(0);
  await first.getByTestId('challenge-a2').click();
  await first.getByTestId('send-challenge').click();
  await expect(first.getByTestId('challenge-result')).toContainText('the step holds');
  await expect(first.getByTestId('challenge-result').getByTestId('check-result')).toContainText('Holds');

  // Ask about steps via the pen
  await first.getByTestId('pen-mode').click();
  const steps = first.locator('.solution-steps');
  await circle(page, steps, { x0: 0.05, y0: 0.02, x1: 0.95, y1: 0.3 });
  const thread = first.getByTestId('step-thread');
  await expect(thread).toHaveCount(1);
  await thread.getByRole('button', { name: 'Explain this' }).click();
  await expect(thread.locator('.chat-coach')).toContainText('Step a1');
  // Challenging the marked steps re-runs the independent check on each of them.
  await thread.getByRole('button', { name: "That's not right?" }).click();
  await expect(thread.locator('.chat-coach').last()).toContainText(/Re-checked a\d: the step holds/);
  await shot(page, '09-alternatives');

  // Submit an own version with the new idea -> same evaluation pipeline
  await first.getByTestId('own-version').click();
  await first.getByTestId('attempt-images-file').setInputFiles(path.join(samples, 'own-version.png'));
  await first.getByTestId('read-solution').click();
  await first.getByTestId('confirm-steps-btn').click();
  await expect(first.getByTestId('score')).toHaveText('7');
  await expect(first.getByTestId('idea-used')).toContainText('yes');
  await shot(page, '10-own-version');

  // Everything is stored locally and survives a reload.
  await page.waitForTimeout(500);
  await page.reload();
  await expect(page.getByTestId('alternative')).toHaveCount(3);
  await page.goto('/#/');
  await expect(page.locator('.session-list li')).toHaveCount(1);
  await expect(page.locator('.session-list')).toContainText('solution checked');

  expect(errors).toEqual([]);
});

test('mobile layout works', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  await page.goto('/');
  await page.getByTestId('new-problem').click();
  await page.getByTestId('problem-images-file').setInputFiles(path.join(samples, 'problem.png'));
  await page.getByTestId('read-problem').click();
  await expect(page.getByTestId('confirm-problem')).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  await page.screenshot({ path: path.join(shots, 'mobile-confirm.png'), fullPage: true });
  await context.close();
});

test('code-check sandbox has no network access', async ({ page }) => {
  await page.goto('/');
  const main = await (await page.request.get((await page.locator('script[type=module]').getAttribute('src'))!)).text();
  const workerUrl = '/assets/' + main.match(/sandbox\.worker-[\w-]+\.js/)![0];
  const res = await page.request.get(workerUrl);
  expect(res.headers()['content-security-policy']).toContain("default-src 'none'");

  const run = (code: string) =>
    page.evaluate(
      ({ url, code }) =>
        new Promise<{ status: string; value?: unknown; error?: string }>((resolve) => {
          const w = new Worker(url, { type: 'module' });
          const t = setTimeout(() => resolve({ status: 'timeout' }), 4000);
          w.onmessage = (e) => {
            clearTimeout(t);
            w.terminate();
            resolve(e.data);
          };
          w.postMessage({ code });
        }),
      { url: workerUrl, code },
    );

  expect(await run('return { holds: true, detail: String(2n ** 64n) };')).toMatchObject({ status: 'ok', value: { holds: true } });
  expect((await run("return fetch('/api/config');")).status).toBe('error');
  expect((await run("return Object.getPrototypeOf(self).fetch ?? WorkerGlobalScope.prototype.fetch;")).value).toBeUndefined();
  expect((await run("return import('/api/config').then(() => 'loaded');")).status).toBe('error');
  expect((await run("return typeof indexedDB;")).value).toBe('undefined');
});

/** Reads the live measurements next to an interactive figure. */
async function measures(figure: Locator): Promise<Record<string, number>> {
  const rows = await figure.getByTestId('measures').locator('div').allInnerTexts();
  return Object.fromEntries(
    rows.map((row) => {
      const [label, value] = row.split('\n').map((s) => s.trim());
      return [label, Number(value)];
    }),
  );
}

test('geometry: interactive figure, counterexamples on random shapes, figures in alternatives', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await page.getByTestId('new-problem').click();

  // The figure in the photo is described in words and confirmed like the text.
  await page.getByTestId('problem-images-file').setInputFiles(path.join(samples, 'geometry-problem.png'));
  await page.getByTestId('read-problem').click();
  await expect(page.getByTestId('problem-text')).toHaveValue(/convex quadrilateral/);
  await expect(page.getByTestId('problem-figure')).toHaveValue(/midpoints with tick marks/);
  await page.getByTestId('confirm-problem-btn').click();
  await expect(page.getByTestId('problem-card').locator('img')).toBeVisible();

  // The first tip comes with an interactive figure instead of a table.
  const figure = page.getByTestId('tip-1').getByTestId('figure');
  await expect(figure.getByTestId('measures')).toBeVisible();
  const before = await measures(figure);
  expect(before['area MNPQ'] * 2).toBeCloseTo(before['area ABCD'], 2);

  const handle = figure.getByTestId('handle-D');
  await figure.locator('svg').scrollIntoViewIfNeeded();
  const box = (await handle.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 - 70, box.y + box.height / 2 - 40, { steps: 8 });
  await page.mouse.up();
  await expect.poll(async () => (await measures(figure))['area ABCD']).not.toBeCloseTo(before['area ABCD'], 1);
  const after = await measures(figure);
  expect(after['area MNPQ'] * 2).toBeCloseTo(after['area ABCD'], 2);
  expect(after.MN).toBeCloseTo(after.PQ, 3);
  await shot(page, 'geo-03-figure');

  // A progress photo with a sketch: the tip builds on the student's own midline idea.
  await page.getByTestId('progress-images-file').setInputFiles(path.join(samples, 'geometry-progress.png'));
  await page.getByTestId('read-progress').click();
  await page.getByTestId('next-tip').click();
  await expect(page.getByTestId('tip-2')).toContainText('lies in a second triangle');
  await expect(page.getByTestId('tip-2').getByTestId('check-result')).toContainText('Holds');

  // Handwritten solution with a sketch: two false area formulas, refuted on random quadrilaterals.
  await page.getByTestId('go-solve').click();
  await page.getByTestId('attempt-images-file').setInputFiles(path.join(samples, 'geometry-solution.png'));
  await page.getByTestId('read-solution').click();
  await page.getByTestId('confirm-steps-btn').click();
  await expect(page.getByTestId('score')).toHaveText('2–3');
  await expect(page.getByTestId('review-4').locator('.mark-label')).toContainText('unclear');
  await expect(page.getByTestId('review-5').locator('.mark-label')).toHaveText('error');
  await expect(page.getByTestId('review-5').getByTestId('check-result')).toContainText('Counterexample found');
  await expect(page.getByTestId('review-6').getByTestId('check-result')).toContainText('but AC · BD / 2 =');
  await shot(page, 'geo-05-feedback');

  const review4 = page.getByTestId('review-4');
  await review4.getByTestId('disagree').click();
  await review4.locator('textarea').fill('MN and QP are both the vector AC/2, so they point the same way.');
  await review4.getByRole('button', { name: 'Send' }).click();
  await expect(review4.locator('.chat-coach')).toContainText('You are right');
  await expect(page.getByTestId('score')).toHaveText('3');

  // Alternatives: the vector solution comes with its own figure; similarity is caught by code.
  await page.getByTestId('tab-learn').click();
  await page.getByTestId('propose').click();
  const alts = page.getByTestId('alternative');
  await alts.nth(0).getByTestId('toggle-alternative').click();
  const solutionFigure = alts.nth(0).getByTestId('solution-figure');
  await expect(solutionFigure.getByTestId('measures')).toContainText('area MNPQ / area ABCD');
  await expect(alts.nth(0).getByTestId('unverified')).toHaveCount(0);
  await alts.nth(1).getByTestId('toggle-alternative').click();
  await expect(alts.nth(1).getByTestId('logic-only')).toBeVisible();
  await alts.nth(2).getByTestId('toggle-alternative').click();
  await expect(alts.nth(2).getByTestId('alternative-discarded')).toBeVisible();
  await shot(page, 'geo-09-alternatives');

  expect(errors).toEqual([]);
});
