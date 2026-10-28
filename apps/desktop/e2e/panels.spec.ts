import { expect, test } from '@playwright/test';
import { apiLogin, client, signIn, uniq } from './fixtures';

test('a notification sent by a manager appears live in the drawer and can be marked read', async ({
  page,
}) => {
  const { userId, api } = await signIn(page);
  await page.goto('/');
  await page.getByRole('button', { name: /Bildirishnomalar/ }).click();
  const drawer = page.getByRole('dialog', { name: 'Bildirishnomalar' });
  await expect(drawer).toBeVisible();

  const title = uniq('Shoshilinch');
  const manager = client((await apiLogin('rahbar')).token);
  await manager.post('/api/notifications', {
    userId,
    category: 'WORK',
    title,
    actionLabel: 'Ochish',
    actionUrl: 'module://edo/control',
  });
  await expect(drawer.getByText(title)).toBeVisible();

  await drawer.getByRole('button', { name: 'Hammasini oʻqildi' }).click();
  await expect
    .poll(async () => ((await api.get('/api/notifications?unread=1')) as { unread: number }).unread)
    .toBe(0);

  await drawer
    .locator('.notif__item', { hasText: title })
    .getByRole('button', { name: 'Ochish' })
    .click();
  await expect(page).toHaveURL(/\/m\/edo\/control$/);
});

test('Esc closes the drawer and returns focus to the bell', async ({ page }) => {
  await signIn(page);
  await page.goto('/');
  const bell = page.getByRole('button', { name: /Bildirishnomalar/ });
  await bell.click();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(bell).toBeFocused();
});

test('Ctrl+K: first row creates a task from the typed text; arrows, Tab and Esc work', async ({
  page,
}) => {
  const { api } = await signIn(page);
  await page.goto('/');
  await page.keyboard.press('Control+k');
  const palette = page.getByRole('dialog', { name: 'Umumiy qidiruv' });
  await expect(palette).toBeVisible();

  const title = uniq('palitra');
  await page.keyboard.type(`ertaga 09:30 ${title} !yuqori`);
  await expect(palette.getByRole('option').first()).toContainText(
    `“${title}” nomli vazifa yaratish`,
  );
  await page.keyboard.press('Tab');
  await expect(palette.getByRole('button', { name: 'Vazifa', pressed: true })).toBeVisible();
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Enter');
  await expect(palette).toHaveCount(0);
  await expect
    .poll(async () =>
      ((await api.get('/api/tasks')) as { items: { title: string }[] }).items.some(
        (t) => t.title === title,
      ),
    )
    .toBe(true);

  await page.keyboard.press('Control+k');
  await page.keyboard.press('Escape');
  await expect(palette).toHaveCount(0);
});

test('palette finds a module document and opens it', async ({ page }) => {
  await signIn(page);
  await page.goto('/');
  await page.keyboard.press('Control+k');
  await page.keyboard.type('458');
  await page
    .getByRole('option', { name: /Buyruq|Xodimlar/ })
    .first()
    .click();
  await expect(page).toHaveURL(/\/m\/edo\/documents\?doc=doc-1/);
});

test('settings: theme, density and menu apps are applied and saved to the server', async ({
  page,
}) => {
  const { api } = await signIn(page);
  await page.goto('/settings');
  await page.getByRole('radio', { name: 'Tungi' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('button', { name: 'Ixcham' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-density', 'compact');
  await expect.poll(async () => ((await api.get('/api/settings')) as any).theme).toBe('dark');

  await page.getByRole('button', { name: 'Menyu va ilovalar' }).click();
  await page.getByRole('switch', { name: 'Facebook' }).click();
  await expect(page.locator('.sidebar').getByRole('link', { name: 'Facebook' })).toBeVisible();
  await expect(page.getByRole('switch', { name: 'Lex.uz' })).toBeDisabled();

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

  // restore for the other tests
  await api.patch('/api/settings', {
    theme: 'light',
    density: 'comfortable',
    pinnedApps: ['telegram', 'whatsapp', 'instagram', 'youtube'],
  });
});
