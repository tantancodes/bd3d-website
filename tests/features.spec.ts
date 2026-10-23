import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const HOME = '0.0000,0.0000,8.2000';

async function openExhibit(page: Page, path: string) {
  await page.goto(path);
  await expect(page.locator('.model-stage')).toHaveAttribute('data-model-ready', 'true');
  return page.locator('.model-stage canvas');
}

test('a deep link opens the exhibit focused on the linked region', async ({ page }) => {
  const canvas = await openExhibit(page, '/exhibits/psamtikseneb?region=text%3Acenter');
  await expect(page.locator('[id="annotation-text:center"] .annotation-title')).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(canvas).not.toHaveAttribute('data-camera', HOME);
  await expect(page).toHaveURL(/region=text%3Acenter/);
});

test('selection is written to the address bar and cleared on reset', async ({ page }) => {
  await openExhibit(page, '/exhibits/psamtik');
  await page.locator('.annotation-title').first().click();
  await expect(page).toHaveURL(/\?region=/);
  await page.getByRole('button', { name: 'Reset view', exact: true }).click();
  await expect(page).toHaveURL(/\/exhibits\/psamtik$/);
});

test('raking light presets change the lighting and are shareable', async ({ page }) => {
  await openExhibit(page, '/exhibits/psamtikseneb');
  await page.getByRole('button', { name: 'Lighting and quality' }).click();
  const panel = page.locator('#inspect-panel');
  await expect(panel).toBeVisible();
  await panel.getByRole('button', { name: 'Raking left' }).click();
  await expect(panel.getByRole('button', { name: 'Raking left' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page).toHaveURL(/light=180%2C12/);
  await expect(panel.getByText(/reveals form and relief, not individual signs/)).toBeVisible();
  await panel.getByRole('button', { name: 'Back to gallery light' }).click();
  await expect(page).not.toHaveURL(/light=/);
  expect(
    (
      await new AxeBuilder({ page })
        .include('#inspect-panel')
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze()
    ).violations,
  ).toEqual([]);
});

test('transliterated words link to vocabulary entries and their locations', async ({ page }) => {
  await openExhibit(page, '/exhibits/psamtikseneb');
  const word = page.getByRole('button', { name: 'ꜣḫt: show vocabulary' }).first();
  await word.click();
  await expect(word).toHaveAttribute('aria-expanded', 'true');
  const card = page.getByRole('group', { name: 'Vocabulary for ꜣḫt' });
  await expect(card).toContainText('horizon');
  await card.getByRole('button', { name: 'Show on object' }).click();
  await expect(card.getByText('Location 1 of 2')).toBeVisible();
  // The reader stays on the inscription while the camera visits the word.
  await expect(page.getByRole('tab', { name: 'Inscriptions', exact: true })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await card.getByRole('button', { name: 'Next location' }).click();
  await expect(card.getByText('Location 2 of 2')).toBeVisible();
});

test('keyboard shortcuts switch views and open the reference', async ({ page }) => {
  const canvas = await openExhibit(page, '/exhibits/irethoreru');
  await page.locator('body').click({ position: { x: 5, y: 300 } });
  await page.keyboard.press('2');
  await expect(page.getByRole('button', { name: 'Back', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(canvas).toHaveAttribute('data-camera', '0.0000,0.0000,-8.2000');
  await page.keyboard.press('r');
  await expect(canvas).toHaveAttribute('data-camera', HOME);
  await page.keyboard.press('?');
  await expect(page.getByRole('dialog', { name: 'Keyboard shortcuts' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Keyboard shortcuts' })).toBeHidden();
});

test('region outlines are drawn in a few batched draw calls', async ({ page }) => {
  // Irethoriru has 265 regions; before batching each outline was its own draw call.
  const canvas = await openExhibit(page, '/exhibits/irethoreru');
  await page.getByRole('tab', { name: 'Vocabulary', exact: true }).click();
  await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
  await expect
    .poll(async () => Number(await canvas.getAttribute('data-draw-calls')))
    .toBeGreaterThan(0);
  expect(Number(await canvas.getAttribute('data-draw-calls'))).toBeLessThan(40);
});

test('preview textures load first and the chosen quality tier follows', async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem('bd3d.quality', 'standard'));
  const requested: string[] = [];
  page.on('request', (r) => {
    if (r.url().includes('/models/')) requested.push(new URL(r.url()).pathname);
  });
  await openExhibit(page, '/exhibits/psamtikseneb');
  await expect(page.locator('.model-stage')).toHaveAttribute('data-texture-tier', '2048');
  expect(requested.some((u) => u.endsWith('-1024.webp'))).toBe(true);
  expect(requested.some((u) => u.endsWith('-2048.webp'))).toBe(true);
  // Neither the source OBJ nor the 4096 px originals are downloaded at this tier.
  expect(requested.some((u) => u.endsWith('.obj') || u.endsWith('.jpg'))).toBe(false);
});

test('collection search finds entries and opens them in place', async ({ page }) => {
  await page.goto('/search');
  await page.getByRole('searchbox', { name: 'Search all inscriptions' }).fill('horizon');
  await expect(page).toHaveURL(/q=horizon/);
  const results = page.locator('.result');
  await expect(results.first()).toBeVisible();
  await page.getByRole('button', { name: 'Vocabulary' }).click();
  await expect(results.first().locator('h3')).toHaveText('ꜣḫt');
  await results.first().locator('a').click();
  await expect(page).toHaveURL(/\/exhibits\/[a-z0-9]+\?region=/);
  await expect(page.locator('.model-stage')).toHaveAttribute('data-model-ready', 'true');
  await expect(page.locator('.annotation.selected')).toHaveCount(1);
  expect(
    (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
      .violations,
  ).toEqual([]);
});

test('search page is accessible and fits a phone screen', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/search?q=osiris');
  await expect(page.locator('.result').first()).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
  ).toBeTruthy();
  expect(
    (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
      .violations,
  ).toEqual([]);
});
