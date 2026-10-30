// The single-file demo (npm run build:demo) must work opened straight from disk.
import { expect, test } from '@playwright/test';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const file = path.resolve('demo/olympiad-coach-demo.html');

test.skip(!existsSync(file), 'run npm run build:demo first');

test('single-file demo runs from disk without a server', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(pathToFileURL(file).href);
  await expect(page.getByTestId('demo-banner')).toContainText('everything runs in this one file');

  await page.getByTestId('test-guide').getByRole('button', { name: /Test checklist 0\/\d+/ }).click();
  await page.getByTestId('test-guide').getByRole('checkbox').first().check();
  await expect(page.getByTestId('test-guide').getByRole('button', { name: /Test checklist 1\// })).toBeVisible();
  await page.getByTestId('test-guide').getByRole('button', { name: /Test checklist/ }).click();

  await page.getByTestId('new-problem').click();
  await page.getByRole('button', { name: 'Sample: number theory' }).click();
  await page.getByTestId('read-problem').click();
  await page.getByTestId('confirm-problem-btn').click();

  // Code-computed table in the first tip: the embedded sandbox worker runs.
  await expect(page.getByTestId('tip-1').getByTestId('cases-table').locator('tbody tr')).toHaveCount(15);
  await page.getByRole('button', { name: 'Use sample progress' }).click();
  await page.getByTestId('read-progress').click();
  await page.getByTestId('next-tip').click();
  await expect(page.getByTestId('tip-2').getByTestId('check-result')).toContainText('Holds');

  await page.getByTestId('go-solve').click();
  await page.getByRole('button', { name: 'Use sample solution' }).click();
  await page.getByTestId('read-solution').click();
  await page.getByTestId('confirm-steps-btn').click();
  await expect(page.getByTestId('score')).toHaveText('3–4');
  await expect(page.getByTestId('review-5').getByTestId('check-result')).toContainText('Counterexample found');

  await page.getByTestId('tab-ask').click();
  const canvas = page.getByTestId('pen-page-1').locator('canvas');
  const r = (await canvas.boundingBox())!;
  await page.mouse.move(r.x + r.width * 0.1, r.y + r.height * 0.2);
  await page.mouse.down();
  await page.mouse.move(r.x + r.width * 0.6, r.y + r.height * 0.22, { steps: 6 });
  await page.mouse.move(r.x + r.width * 0.55, r.y + r.height * 0.4, { steps: 6 });
  await page.mouse.move(r.x + r.width * 0.12, r.y + r.height * 0.38, { steps: 6 });
  await page.mouse.up();
  await expect(page.getByTestId('lens-box')).toBeVisible();

  await page.getByTestId('tab-learn').click();
  await page.getByTestId('propose').click();
  await expect(page.getByTestId('alternative')).toHaveCount(3);
  await page.getByTestId('alternative').nth(2).getByTestId('toggle-alternative').click();
  await expect(page.getByTestId('alternative-discarded')).toBeVisible();

  expect(errors).toEqual([]);
});
