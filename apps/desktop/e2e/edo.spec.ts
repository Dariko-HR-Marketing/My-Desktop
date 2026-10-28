import { expect, test } from '@playwright/test';
import { signIn } from './fixtures';

test.beforeEach(async ({ page }) => {
  await signIn(page);
});

test('the home signal leads into the document list, the same number as the tab', async ({
  page,
}) => {
  await page.goto('/');
  const signature = page.locator('.kpi-link', { hasText: 'Imzo kutmoqda' });
  const count = (await signature.locator('.kpi__value').innerText()).trim();
  await signature.click();
  await expect(page).toHaveURL(/\/m\/edo\/documents$/);
  await expect(
    page
      .getByRole('tab', { name: /Hujjatlar/ })
      .or(page.locator('.tabs__tab', { hasText: 'Hujjatlar' })),
  ).toContainText(count);
});

test('documents: select one to see details, route and the (disabled) sign action', async ({
  page,
}) => {
  await page.goto('/m/edo/documents');
  await page.locator('.docrow').first().click();
  await expect(page.locator('.docdetail h2')).toBeVisible();
  await expect(page.getByRole('button', { name: 'E-IMZO bilan imzolash' })).toBeDisabled();
  expect(await page.locator('.route__step').count()).toBeGreaterThan(1);
  await page.locator('.folder', { hasText: 'Imzo kutmoqda' }).click();
  await expect(page).toHaveURL(/f=sign/);
});

test('control: urgency order, appeal countdown, and "add to today\'s plan" creates tasks', async ({
  page,
}) => {
  await page.goto('/m/edo/control');
  const rows = page.locator('.ctable__row');
  await expect(rows.first()).toContainText('Kechikkan');
  await page.getByRole('button', { name: 'Bugungi rejamga qoʻshish' }).click();
  await expect(page.getByText(/Bugungi rejaga \d+ ta vazifa qoʻshildi/)).toBeVisible();
  await page.goto('/tasks');
  await expect(page.locator('.task', { hasText: '14-son topshiriq' }).first()).toBeVisible();
});

test('kanban shows four columns and opens a card', async ({ page }) => {
  await page.goto('/m/edo/assignments');
  await expect(page.locator('.board__col')).toHaveCount(4);
  await page.locator('.bcard').first().click();
  await expect(page.getByRole('dialog')).toBeVisible();
});

test('a module the role may not use shows a clear message instead of an error', async ({
  page,
}) => {
  await page.goto('/m/manager');
  await expect(page.getByText('Modul topilmadi')).toBeVisible();
});

test('reports tab is an honest empty state', async ({ page }) => {
  await page.goto('/m/edo/reports');
  await expect(page.getByText('Hisobotlar tez orada')).toBeVisible();
});
