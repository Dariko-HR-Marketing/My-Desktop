import { expect, test } from '@playwright/test';
import { signIn } from './fixtures';

test('without a connected calendar the home page says so and links to the setting', async ({
  page,
}) => {
  await signIn(page);
  await page.goto('/');
  await expect(page.getByText('Kalendar ulanmagan')).toBeVisible();
  await page.getByRole('link', { name: 'Kalendarni ulash' }).click();
  await expect(page).toHaveURL(/\/settings\?s=calendar$/);
  await expect(page.getByLabel('Kalendarning maxfiy iCal (.ics) manzili')).toBeVisible();
});

test("unsafe calendar addresses are refused with the server's reason", async ({ page }) => {
  const { api } = await signIn(page);
  await page.goto('/settings?s=calendar');
  const field = page.getByLabel('Kalendarning maxfiy iCal (.ics) manzili');
  for (const [bad, reason] of [
    ['http://calendar.example.com/a.ics', 'Faqat https:// manzil qabul qilinadi'],
    ['https://127.0.0.1/a.ics', 'IP manzil emas, domen nomi kerak'],
    ['https://localhost/a.ics', 'Bu manzilga ruxsat yoʻq'],
  ] as const) {
    await field.fill(bad);
    await page.getByRole('button', { name: 'Ulash' }).click();
    await expect(page.getByRole('alert')).toHaveText(reason);
  }
  expect(((await api.get('/api/settings')) as { calendarUrl: string }).calendarUrl).toBe('');
});
