import { expect, test } from '@playwright/test';
import { signIn } from './fixtures';

test('unauthenticated visitors are sent to the login page', async ({ page }) => {
  await page.goto('/tasks');
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading', { name: 'Ish maydoniga kirish' })).toBeVisible();
});

test('empty form shows both errors and focuses the first field', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('button', { name: 'Kirish', exact: true }).click();
  await expect(page.getByText('Loginni kiriting')).toBeVisible();
  await expect(page.getByText('Parolni kiriting')).toBeVisible();
  await expect(page.locator('#login')).toBeFocused();
});

test('wrong password does not reveal which field was wrong', async ({ page }) => {
  await page.goto('/login');
  await page.locator('#login').fill('xodim');
  await page.locator('#password').fill('noto‘g‘ri-parol');
  await page.getByRole('button', { name: 'Kirish', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText('Login yoki parol notoʻgʻri');
});

test('signs in, shows the home page, and signs out', async ({ page }) => {
  await page.goto('/login');
  await page.locator('#login').fill('xodim');
  await page.locator('#password').fill('demo12345');
  await page.getByRole('button', { name: 'Kirish', exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Aziz');
  await page.getByRole('button', { name: 'Chiqish' }).click();
  await expect(page).toHaveURL(/\/login$/);
});

test('a restored session opens the app without asking for a password', async ({ page }) => {
  await signIn(page);
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Aziz');
});
