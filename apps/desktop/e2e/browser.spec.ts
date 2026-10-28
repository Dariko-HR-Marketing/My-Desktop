import { expect, test } from '@playwright/test';
import { signIn } from './fixtures';

test.beforeEach(async ({ page }) => {
  await signIn(page);
});

test('the browser page keeps the menu in icon mode and shows the start page', async ({ page }) => {
  await page.goto('/browser');
  await expect(page.locator('.start')).toBeVisible();
  await expect(page.locator('.topbar')).toHaveCount(0);
  expect((await page.locator('.sidebar').boundingBox())?.width).toBe(72);
  await expect(page.locator('.tile')).toHaveCount(8);
  await expect(page.locator('.site')).toHaveCount(6);
});

test('only http and https addresses can be opened', async ({ page }) => {
  await page.goto('/browser');
  const bar = page.getByLabel('Manzil yoki qidiruv soʻzi');
  for (const bad of ['javascript:alert(1)', 'file:///etc/passwd', 'data:text/html,x']) {
    await bar.fill(bad);
    await bar.press('Enter');
    await expect(
      page.getByText('Faqat http va https manzillarni ochish mumkin').first(),
    ).toBeVisible();
    await expect(page.locator('.start')).toBeVisible();
  }
});

test('an address opens in a grouped tab; a network from the menu opens its own tab once', async ({
  page,
}) => {
  await page.goto('/browser');
  const bar = page.getByLabel('Manzil yoki qidiruv soʻzi');
  await bar.fill('lex.uz');
  await bar.press('Enter');
  await expect(page.locator('.viewport__frame')).toHaveAttribute('src', 'https://lex.uz/');
  await expect(page.locator('.tabgroup')).toHaveText('Ish');

  await page.locator('.sidebar').getByRole('link', { name: 'Telegram' }).click();
  await expect(page.locator('.tab')).toHaveCount(2);
  await page.locator('.sidebar').getByRole('link', { name: 'Telegram' }).click();
  await expect(page.locator('.tab')).toHaveCount(2);
  await expect(page.locator('.sidebar').getByRole('link', { name: 'Telegram' })).toHaveAttribute(
    'aria-current',
    'page',
  );
});

test('Ctrl+T opens a tab, Ctrl+W closes it, Ctrl+L focuses the address bar', async ({ page }) => {
  await page.goto('/browser');
  const before = await page.locator('.tab').count();
  await page.keyboard.press('Control+t');
  await expect(page.locator('.tab')).toHaveCount(before + 1);
  await page.keyboard.press('Control+w');
  await expect(page.locator('.tab')).toHaveCount(before);
  await page.keyboard.press('Control+l');
  await expect(page.getByLabel('Manzil yoki qidiruv soʻzi')).toBeFocused();
});

test('tabs survive a reload', async ({ page }) => {
  await page.goto('/browser');
  await page.locator('.site', { hasText: 'soliq.uz' }).click();
  await expect(page.locator('.viewport__frame')).toBeVisible();
  await page.reload();
  await expect(page.locator('.tab', { hasText: 'soliq.uz' })).toBeVisible();
});
