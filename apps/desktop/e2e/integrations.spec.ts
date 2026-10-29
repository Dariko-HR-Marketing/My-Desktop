import { expect, test } from '@playwright/test';
import { signIn } from './fixtures';

const KEY = 'sk-e2e-SECRET-9876';

test('an administrator connects a service; the key is never shown again, only its tail', async ({
  page,
}) => {
  const { api } = await signIn(page, 'admin');
  await page.goto('/settings?s=integrations');
  await expect(page.getByRole('heading', { name: 'Sunʼiy intellekt' })).toBeVisible();
  await expect(page.getByText('Anthropic (Claude)')).toBeVisible();

  await page.getByRole('button', { name: 'OpenAI (GPT): sozlash' }).click();
  const field = page.getByLabel('API kalit *');
  await expect(field).toHaveAttribute('type', 'password');

  // required field
  await page.getByRole('button', { name: 'Saqlash va tekshirish' }).click();
  await expect(page.getByText('Bu maydon majburiy')).toBeVisible();

  await field.fill(KEY);
  await page.getByRole('button', { name: 'Saqlash va tekshirish' }).click();
  // the real provider is not reachable with a fake key: either way the check reports a result
  await expect(page.getByRole('status').filter({ hasText: /Xato|Ishlayapti/ })).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.getByText('Saqlangan: ••••9876')).toBeVisible();
  await expect(page.locator('body')).not.toContainText(KEY);

  const list = (await api.get('/api/integrations')) as {
    items: { key: string; connected: boolean }[];
  };
  expect(list.items.find((i) => i.key === 'openai')?.connected).toBe(true);
  expect(JSON.stringify(list)).not.toContain(KEY);

  await page.getByRole('button', { name: 'Uzish' }).click();
  await expect(page.getByText('OpenAI (GPT) uzildi')).toBeVisible();
  const after = (await api.get('/api/integrations')) as {
    items: { key: string; connected: boolean }[];
  };
  expect(after.items.find((i) => i.key === 'openai')?.connected).toBe(false);
});

test('an employee cannot change organisation-wide services but can connect a personal one', async ({
  page,
}) => {
  await signIn(page, 'xodim');
  await page.goto('/settings?s=integrations');
  await expect(page.getByText('Anthropic (Claude)')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Anthropic (Claude): sozlash' })).toHaveCount(0);
  await expect(page.getByText('Faqat administrator').first()).toBeVisible();

  await page.getByRole('button', { name: 'GitHub: sozlash' }).click();
  await page.getByLabel('Personal access token *').fill('ghp_e2e_TOKEN_1234');
  await page.getByRole('button', { name: 'Saqlash va tekshirish' }).click();
  await expect(page.getByText('Saqlangan: ••••1234')).toBeVisible({ timeout: 20_000 });
  await page.getByRole('button', { name: 'Uzish' }).click();
  await expect(page.getByText('GitHub uzildi')).toBeVisible();
});
