import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { noHorizontalScroll, signIn } from './fixtures';

// @axe-core/playwright is typed against an older playwright-core; the runtime API is identical.
const axe = (page: Page) =>
  new AxeBuilder({ page: page as never }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']);

const PAGES = [
  '/',
  '/tasks',
  '/browser',
  '/settings',
  '/settings?s=menu',
  '/m/edo',
  '/m/edo/documents?doc=doc-1',
  '/m/edo/control',
  '/m/edo/assignments',
];

for (const theme of ['light', 'dark'] as const) {
  test(`WCAG 2.1 AA: no axe violations (${theme} theme)`, async ({ page }) => {
    test.setTimeout(90_000);
    await signIn(page, 'xodim', theme);
    for (const path of PAGES) {
      await page.goto(path);
      await page.waitForTimeout(500);
      const { violations } = await axe(page).analyze();
      expect(
        violations.map((v) => `${v.id}: ${v.nodes[0]?.target.join(' ')}`),
        path,
      ).toEqual([]);
    }
  });
}

test('login page passes axe too', async ({ page }) => {
  await page.goto('/login');
  const { violations } = await axe(page).analyze();
  expect(violations.map((v) => v.id)).toEqual([]);
});

for (const width of [1440, 1100, 800, 390]) {
  test(`no horizontal scroll at ${width}px`, async ({ page }) => {
    test.setTimeout(60_000);
    await page.setViewportSize({ width, height: 900 });
    await signIn(page);
    for (const path of PAGES) {
      await page.goto(path);
      await page.waitForTimeout(250);
      expect(await noHorizontalScroll(page), path).toBe(0);
    }
  });
}

test('navigation mode follows the window width', async ({ page }) => {
  await signIn(page);
  for (const [width, mode] of [
    [1440, 'full'],
    [1100, 'rail'],
    [800, 'rail'],
    [390, 'bottom'],
  ] as const) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await expect(page.locator('.shell')).toHaveAttribute('data-nav', mode);
  }
});
