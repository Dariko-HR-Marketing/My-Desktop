import { describe, expect, it } from 'vitest';
import type { Task } from '@ish-maydoni/shared';
import { buildPalette, flatten, moveIndex } from './palette';

let n = 0;
const task = (title: string, o: Partial<Task> = {}): Task => ({
  id: `t${++n}`,
  title,
  notes: null,
  source: 'PERSONAL',
  status: 'TODO',
  priority: 'NORMAL',
  dueAt: null,
  assignedBy: null,
  assignee: null,
  list: null,
  externalRef: null,
  createdAt: '',
  updatedAt: '',
  completedAt: null,
  ...o,
});
const ctx = {
  tasks: [
    task('Oylik hisobotni tayyorlash'),
    task('Boʻlim yigʻilishi'),
    task('Xat yozish', { assignee: 'Karimov' }),
  ],
  docs: [
    { id: 'd1', number: '03-12/458', title: 'Buyruq loyihasi' },
    { id: 'd2', number: '03-12/460', title: 'Xizmat xati' },
  ],
};
const keys = (q: string, f: 'all' | 'task' | 'doc' | 'web' = 'all') =>
  buildPalette(q, ctx, f).map((s) => s.key);

describe('buildPalette', () => {
  it('empty query shows only the quick actions', () => {
    const s = buildPalette('', ctx);
    expect(s.map((x) => x.key)).toEqual(['actions']);
    expect(s[0]!.items.length).toBeGreaterThan(3);
  });

  it('puts "create task" first for a non-empty query, using the parsed title', () => {
    const first = flatten(buildPalette('ertaga 10:00 hisobot !yuqori', ctx))[0]!;
    expect(first.title).toBe('“hisobot” nomli vazifa yaratish');
    expect(first.action.type).toBe('createTask');
  });

  it('matches tasks, ignoring apostrophe variants and case', () => {
    const titles = (q: string) =>
      buildPalette(q, ctx)
        .find((s) => s.key === 'tasks')
        ?.items.map((i) => i.title);
    expect(titles('hisobot')).toEqual(['Oylik hisobotni tayyorlash']);
    expect(titles('YIGʼILISHI')).toEqual(['Boʻlim yigʻilishi']);
    expect(titles('karimov')).toEqual(['Xat yozish']);
    expect(titles('yoq-mi-yoq')).toBeUndefined();
  });

  it('matches documents by number or title', () => {
    expect(buildPalette('458', ctx).find((s) => s.key === 'docs')?.items[0]?.hint).toBe(
      '03-12/458',
    );
    expect(buildPalette('xizmat', ctx).find((s) => s.key === 'docs')?.items).toHaveLength(1);
  });

  it('finds apps and offers a Google search', () => {
    expect(buildPalette('telegram', ctx).find((s) => s.key === 'apps')?.items[0]?.action).toEqual({
      type: 'openApp',
      key: 'telegram',
    });
    const web = buildPalette('ob-havo toshkent', ctx).find((s) => s.key === 'web')!;
    expect(web.items.at(-1)).toMatchObject({
      action: { type: 'openUrl', url: expect.stringContaining('google.com/search?q=ob-havo') },
    });
  });

  it('recognises an address and offers to open it', () => {
    const web = buildPalette('lex.uz', ctx).find((s) => s.key === 'web')!;
    expect(web.items[0]).toMatchObject({ action: { type: 'openUrl', url: 'https://lex.uz/' } });
  });

  it('applies the filter chips', () => {
    expect(keys('hisobot', 'task')).toEqual(['actions', 'tasks']);
    expect(keys('458', 'doc')).toEqual(['docs']);
    expect(keys('hisobot', 'web')).toEqual(['web']);
  });

  it('shows a disabled AI row only for longer queries', () => {
    expect(keys('ab')).not.toContain('ai');
    expect(
      buildPalette('hisobot haqida', ctx).find((s) => s.key === 'ai')?.items[0]?.action,
    ).toEqual({ type: 'disabled' });
  });

  it('limits each section to five rows', () => {
    const many = { ...ctx, tasks: Array.from({ length: 12 }, (_, i) => task(`hisobot ${i}`)) };
    expect(buildPalette('hisobot', many).find((s) => s.key === 'tasks')!.items).toHaveLength(5);
  });
});

describe('moveIndex', () => {
  const items = flatten(buildPalette('hisobot haqida', ctx));
  it('wraps around', () => {
    expect(moveIndex(items, items.length - 2, 1)).toBe(0); // the last row is the disabled AI one
    expect(moveIndex(items, 0, -1)).toBe(items.length - 2);
  });
  it('skips disabled rows', () => {
    const last = items.length - 1;
    expect(items[last]!.action.type).toBe('disabled');
    expect(moveIndex(items, last - 1, 1)).not.toBe(last);
  });
});
