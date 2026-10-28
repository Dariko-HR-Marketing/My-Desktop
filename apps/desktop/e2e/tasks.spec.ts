import { expect, test } from '@playwright/test';
import { API, signIn, uniq } from './fixtures';

test('quick add parses date, time, priority, assignee and list', async ({ page }) => {
  const { api } = await signIn(page);
  await page.goto('/tasks');
  const title = uniq('hisobot');
  await page.locator('#quick-add').fill(`ertaga 10:00 ${title} !yuqori @Karimov #ishreja`);
  const chips = page.locator('.quick__meta .chip');
  await expect(chips).toHaveCount(5);
  await expect(chips.nth(1)).toHaveText('10:00');
  await expect(chips.nth(2)).toHaveText('Yuqori');
  await expect(chips.nth(3)).toHaveText('@Karimov');
  await page.locator('#quick-add').press('Enter');
  await expect(page.locator('#quick-add')).toHaveValue('');

  await expect
    .poll(async () =>
      ((await api.get('/api/tasks')) as { items: { title: string }[] }).items.some(
        (t) => t.title === title,
      ),
    )
    .toBe(true);
  const task = ((await api.get('/api/tasks')) as { items: any[] }).items.find(
    (t) => t.title === title,
  );
  expect(task).toMatchObject({ priority: 'HIGH', assignee: 'Karimov', list: 'ishreja' });
  expect(new Date(task.dueAt).getHours()).toBe(10);
});

test('Esc clears the field and N focuses it', async ({ page }) => {
  await signIn(page);
  await page.goto('/tasks');
  await page.keyboard.press('n');
  await expect(page.locator('#quick-add')).toBeFocused();
  await page.locator('#quick-add').fill('keraksiz matn');
  await page.keyboard.press('Escape');
  await expect(page.locator('#quick-add')).toHaveValue('');
});

test('editing a task in the detail panel is saved to the server', async ({ page }) => {
  const { api } = await signIn(page);
  const title = uniq('tahrir');
  const created = (await api.post('/api/tasks', { title })) as { id: string };
  await page.goto(`/tasks?task=${created.id}`);
  await page.locator('#d-title').fill(`${title} yangilandi`);
  await page.locator('#d-title').blur();
  await page.locator('#d-priority').selectOption('HIGH');
  await expect
    .poll(
      async () =>
        ((await api.get('/api/tasks')) as { items: any[] }).items.find((t) => t.id === created.id)
          ?.priority,
    )
    .toBe('HIGH');
  const saved = ((await api.get('/api/tasks')) as { items: any[] }).items.find(
    (t) => t.id === created.id,
  );
  expect(saved.title).toBe(`${title} yangilandi`);
});

test('a task added offline is queued, survives a reload, and is sent when the network returns', async ({
  page,
  context,
}) => {
  const { api } = await signIn(page);
  await page.goto('/tasks');
  await expect(page.locator('#quick-add')).toBeVisible();
  const title = uniq('oflayn');

  await context.route(`${API}/**`, (r) => r.abort());
  await page.locator('#quick-add').fill(title);
  await page.locator('#quick-add').press('Enter');
  const row = page.locator('.task', { hasText: title });
  await expect(row.getByText('Navbatda')).toBeVisible();

  await page.reload();
  await expect(page.locator('.task', { hasText: title }).getByText('Navbatda')).toBeVisible();

  await context.unroute(`${API}/**`);
  await page.evaluate(() => window.dispatchEvent(new Event('online')));
  await expect
    .poll(
      async () =>
        ((await api.get('/api/tasks')) as { items: { title: string }[] }).items.filter(
          (t) => t.title === title,
        ).length,
    )
    .toBe(1);
  await expect(page.locator('.task', { hasText: title }).getByText('Navbatda')).toHaveCount(0);
});

test('completing a task on the home page updates the counter at once', async ({ page }) => {
  const { api } = await signIn(page);
  const title = uniq('bugungi');
  await api.post('/api/tasks', { title, dueAt: new Date(Date.now() + 60_000).toISOString() });
  await page.goto('/');
  const kpi = page.locator('.kpi').first();
  const before = await kpi.innerText();
  await page.getByRole('checkbox', { name: new RegExp(title) }).check();
  await expect(kpi).not.toHaveText(before);
});
