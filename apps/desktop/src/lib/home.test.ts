import { describe, expect, it } from 'vitest';
import type { Task } from '@ish-maydoni/shared';
import {
  attentionTasks,
  computeTaskStats,
  dueLabel,
  greeting,
  resolveActionUrl,
  summarySentence,
  todayTasks,
  toggled,
} from './home';

const now = new Date(2026, 9, 28, 12, 0); // 28 Oct 2026, 12:00 local
const at = (day: number, h: number) => new Date(2026, 9, day, h, 0).toISOString();
let n = 0;
const task = (over: Partial<Task>): Task => ({
  id: String(++n),
  title: 't',
  notes: null,
  source: 'PERSONAL',
  status: 'TODO',
  priority: 'NORMAL',
  dueAt: null,
  assignedBy: null,
  assignee: null,
  list: null,
  externalRef: null,
  createdAt: at(1, 0),
  updatedAt: at(1, 0),
  completedAt: null,
  ...over,
});

describe('greeting', () => {
  it('follows the time of day', () => {
    expect(greeting(8, 'Aziz Karimov')).toBe('Xayrli tong, Aziz');
    expect(greeting(13, 'Aziz Karimov')).toBe('Xayrli kun, Aziz');
    expect(greeting(20, 'Aziz Karimov')).toBe('Xayrli kech, Aziz');
  });
  it('omits the dangling comma without a name', () => {
    expect(greeting(8, null)).toBe('Xayrli tong');
  });
});

describe('task stats', () => {
  const tasks = [
    task({ dueAt: at(27, 18) }),
    task({ dueAt: at(28, 9), status: 'DONE' }),
    task({ dueAt: at(28, 15) }),
    task({ dueAt: at(30, 10) }),
    task({}),
    task({ dueAt: at(28, 10), status: 'CANCELLED' }),
  ];
  it('counts today, done, open and overdue', () => {
    expect(computeTaskStats(tasks, now)).toEqual({ today: 2, todayDone: 1, open: 4, overdue: 1 });
  });
  it('lists today tasks by time and skips cancelled', () => {
    expect(todayTasks(tasks, now).map((x) => x.dueAt)).toEqual([at(28, 9), at(28, 15)]);
  });
});

describe('attentionTasks', () => {
  it('takes overdue and due-today open tasks, most overdue first, capped at 5', () => {
    const many = [26, 25, 27, 28, 28, 28, 28].map((d, i) => task({ dueAt: at(d, 10 + (i % 3)) }));
    const result = attentionTasks(
      [...many, task({ dueAt: at(29, 9) }), task({ dueAt: at(28, 9), status: 'DONE' })],
      now,
    );
    expect(result).toHaveLength(5);
    expect(result[0]!.dueAt).toBe(at(25, 11));
    expect(result.every((x) => x.status === 'TODO')).toBe(true);
  });
});

describe('dueLabel', () => {
  it('says today, yesterday, or the date', () => {
    expect(dueLabel(task({ dueAt: at(28, 14) }), now)).toBe('Bugun 14:00');
    expect(dueLabel(task({ dueAt: at(27, 18) }), now)).toBe('Kecha 18:00');
    expect(dueLabel(task({ dueAt: at(24, 9) }), now)).toBe('24-oktabr 09:00');
  });
});

describe('summarySentence', () => {
  it('joins the parts', () => {
    expect(summarySentence({ today: 5, todayDone: 1, open: 4, overdue: 2 }, '14:00')).toBe(
      '4 ta vazifa qoldi · 2 tasi kechikkan · 14:00 da uchrashuv',
    );
  });
  it('omits overdue when zero and handles no open tasks', () => {
    expect(summarySentence({ today: 1, todayDone: 0, open: 1, overdue: 0 })).toBe(
      '1 ta vazifa qoldi',
    );
    expect(summarySentence({ today: 0, todayDone: 0, open: 0, overdue: 0 })).toBe(
      'Hozircha ochiq vazifa yoʻq',
    );
  });
});

describe('misc', () => {
  it('resolves module and web links', () => {
    expect(resolveActionUrl('module://edo/documents')).toEqual({
      internal: true,
      to: '/m/edo/documents',
    });
    expect(resolveActionUrl('module://edo')).toEqual({ internal: true, to: '/m/edo' });
    expect(resolveActionUrl('https://web.telegram.org/a/')).toEqual({
      internal: false,
      to: 'https://web.telegram.org/a/',
    });
  });
  it('toggles done and back', () => {
    const done = toggled(task({}), now);
    expect(done).toMatchObject({ status: 'DONE', completedAt: now.toISOString() });
    expect(toggled(done, now)).toMatchObject({ status: 'TODO', completedAt: null });
  });
});
