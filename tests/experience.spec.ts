import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// The first-visit intro is covered by its own test; elsewhere start as a returning visitor.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('bd3d.intro', '1'));
});

const slugs = ['psamtikseneb', 'irethoreru', 'iwefaa2', 'anonymous1', 'amenirdis', 'psamtik'];
async function noOverflow(page: import('@playwright/test').Page) {
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
  ).toBeTruthy();
}
test('collection is accessible, filterable, responsive and loads no 3D assets', async ({
  page,
}) => {
  const assets: string[] = [];
  page.on('request', (r) => {
    if (/\/models\/|\/api\/coffins\/|\/vendor\/nederhof\//.test(r.url())) assets.push(r.url());
  });
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to collection' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#collection')).toBeInViewport();
  await expect(page.locator('.exhibit-card')).toHaveCount(6);
  await page.getByRole('button', { name: 'Stone', exact: true }).click();
  await expect(page.locator('.exhibit-card')).toHaveCount(2);
  await page.getByRole('button', { name: 'All objects' }).click();
  await page.getByRole('textbox', { name: 'Search the collection' }).fill('Amenirdis');
  await expect(page.locator('.exhibit-card')).toHaveCount(1);
  await page.getByRole('textbox', { name: 'Search the collection' }).fill('no such object');
  await expect(page.getByText('No objects found.')).toBeVisible();
  await page.getByRole('button', { name: 'Reset filters' }).click();
  for (const width of [1440, 820, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.locator('.exhibit-card').first().scrollIntoViewIfNeeded();
    await expect(page.locator('.site-header')).toBeInViewport({ ratio: 1 });
    await noOverflow(page);
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.locator('.collection-grid').scrollIntoViewIfNeeded();
  for (const card of await page.locator('.exhibit-card').all()) await card.scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: 'test-results/home-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'test-results/home-mobile.png', fullPage: true });
  expect(assets).toEqual([]);
  expect(
    (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
      .violations,
  ).toEqual([]);
});
for (const slug of slugs)
  test(`${slug}: mobile layout, accessible reader and keyboard controls`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text());
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`/exhibits/${slug}`);
    await expect(page.locator('.model-stage')).toHaveAttribute('data-model-ready', 'true');
    await noOverflow(page);
    await page.screenshot({ path: `test-results/${slug}-mobile.png`, fullPage: true });
    await page.getByRole('tab', { name: 'Inscriptions', exact: true }).focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('tab', { name: 'Stories', exact: true })).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('tab', { name: 'Vocabulary', exact: true })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await page.getByRole('tab', { name: 'Inscriptions', exact: true }).click();
    await page.locator('.annotation-title').first().focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('.annotation-title').first()).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('button', { name: 'Expand model', exact: true }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Shift+Tab');
    await expect
      .poll(() => page.evaluate(() => !!document.activeElement?.closest('[role=dialog]')))
      .toBe(true);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: 'Expand model', exact: true })).toBeFocused();
    expect(
      (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
        .violations,
    ).toEqual([]);
    expect(errors).toEqual([]);
  });
test('research sources are available and layout is accessible', async ({ page }) => {
  await page.goto('/research');
  await expect(page.locator('.source-list article')).toHaveCount(6);
  await page.screenshot({ path: 'test-results/research-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await noOverflow(page);
  await page.screenshot({ path: 'test-results/research-mobile.png', fullPage: true });
  expect(
    (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
      .violations,
  ).toEqual([]);
});
test('renderer failure gives a readable fallback', async ({ page }) => {
  await page.route('**/vendor/nederhof/reslite.js', (r) => r.abort());
  await page.goto('/exhibits/psamtik');
  await expect(
    page.getByText('Transcription rendering is unavailable. Consult the source edition.').first(),
  ).toBeVisible();
  await expect(page.locator('.translation').first()).toBeVisible();
});
test('unknown exhibits and API return 404', async ({ request }) => {
  expect((await request.get('/exhibits/not-an-object')).status()).toBe(404);
  expect((await request.get('/api/coffins/not-an-object')).status()).toBe(404);
});

test('client navigation keeps each exhibit state isolated', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  await page.goto('/');
  await page.getByRole('link', { name: 'Enter the Psamtik-Seneb exhibit', exact: true }).click();
  for (const slug of slugs) {
    await expect(page).toHaveURL(new RegExp(`/exhibits/${slug}$`));
    await expect(page.locator('.model-stage')).toHaveAttribute('data-model-ready', 'true');
    await expect(page.locator('.annotation.selected')).toHaveCount(0);
    await page.locator('.annotation-title').first().click();
    await expect(page.locator('.annotation.selected')).toHaveCount(1);
    if (slug !== 'psamtik') await page.locator('.next-exhibit').click();
  }
  expect(errors).toEqual([]);
});
test('desktop accessibility and tablet exhibit layout', async ({ page }) => {
  for (const path of ['/', '/research', '/exhibits/psamtikseneb']) {
    await page.goto(path);
    if (path === '/') {
      await expect(page.locator('#hero-title')).toHaveCSS('opacity', '1');
      await page.waitForFunction(() =>
        document.getAnimations().every((a) => a.playState === 'finished'),
      );
    }
    if (path.startsWith('/exhibits/')) {
      await expect(page.locator('.exhibit-intro')).toHaveCSS('opacity', '1');
      await expect(page.locator('.model-stage')).toHaveAttribute('data-model-ready', 'true');
    }
    expect(
      (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
        .violations,
    ).toEqual([]);
  }
  await page.setViewportSize({ width: 820, height: 1180 });
  await expect(page.locator('.model-stage')).toHaveAttribute('data-model-ready', 'true');
  await noOverflow(page);
  await page.screenshot({ path: 'test-results/exhibit-tablet.png', fullPage: true });
});

test('first visit plays the intro once, can be skipped, and respects reduced motion', async ({
  browser,
}) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('/');
  const root = page.locator('html');
  await expect(root).toHaveClass(/intro-play/);
  await expect(page.locator('.intro')).toBeVisible();
  // The overlay never blocks the page, and the headline is in the accessibility tree throughout.
  await expect(page.locator('.intro')).toHaveCSS('pointer-events', 'none');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Read ancient coffins where the words were written.',
  );
  await expect(root).toHaveClass(/intro-seen/, { timeout: 5000 });
  await expect(page.locator('.intro')).toBeHidden();
  await page.reload();
  await expect(root).toHaveClass(/intro-seen/);
  await expect(root).not.toHaveClass(/intro-play/);
  await context.close();

  const skipped = await browser.newPage();
  await skipped.goto('/');
  await expect(skipped.locator('html')).toHaveClass(/intro-play/);
  await skipped.keyboard.press('Shift');
  await expect(skipped.locator('html')).toHaveClass(/intro-seen/);
  await expect(skipped.locator('.intro')).toBeHidden();
  await skipped.close();

  const reduced = await browser.newContext({ reducedMotion: 'reduce' });
  const still = await reduced.newPage();
  await still.goto('/');
  await expect(still.locator('html')).toHaveClass(/intro-seen/);
  await expect(still.locator('.intro')).toBeHidden();
  await reduced.close();
});
