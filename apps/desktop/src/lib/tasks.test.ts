import { describe, expect, it } from 'vitest';
import type { Task } from '@ish-maydoni/shared';
import {
  distinctAssignees,
  filterTasks,
  fromLocalInput,
  groupTasks,
  NO_FILTERS,
  toLocalInput,
} from './tasks';

const now = new Date(2026, 9, 28, 12, 0);
const at = (d: number, h: number, m = 0) => new Date(2026, 9, d, h, m).toISOString();
let n = 0;
const task = (o: Partial<Task>): Task => ({
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
  ...o,
});

const sample = [
  task({ title: 'late', dueAt: at(27, 18) }),
  task({ title: 'earlier today', dueAt: at(28, 9) }),
  task({ title: 'later today', dueAt: at(28, 17) }),
  task({
    title: 'next week',
    dueAt: new Date(2026, 10, 3, 10).toISOString(),
    source: 'MANAGER',
    priority: 'HIGH',
    assignee: 'Karimov',
  }),
  task({ title: 'undated' }),
  task({ title: 'done', status: 'DONE', dueAt: at(28, 10), completedAt: at(28, 11) }),
  task({ title: 'cancelled', status: 'CANCELLED' }),
];

describe('groupTasks', () => {
  const g = groupTasks(sample, now);
  const titles = (l: Task[]) => l.map((t) => t.title);
  it('puts open tasks past their time into overdue, oldest first', () => {
    expect(titles(g.overdue)).toEqual(['late', 'earlier today']);
  });
  it('puts later-today tasks into today', () => {
    expect(titles(g.today)).toEqual(['later today']);
  });
  it('puts future and undated tasks into upcoming, undated last', () => {
    expect(titles(g.upcoming)).toEqual(['next week', 'undated']);
  });
  it('puts done and cancelled into done, newest first', () => {
    expect(titles(g.done)).toEqual(['done', 'cancelled']);
  });
});

describe('filterTasks', () => {
  it('filters by period', () => {
    expect(
      filterTasks(sample, { ...NO_FILTERS, period: 'today' }, now).map((t) => t.title),
    ).toEqual(['earlier today', 'later today', 'done']);
    expect(filterTasks(sample, { ...NO_FILTERS, period: 'week' }, now).map((t) => t.title)).toEqual(
      ['earlier today', 'later today', 'next week', 'done'],
    );
    expect(
      filterTasks(sample, { ...NO_FILTERS, period: 'month' }, now).map((t) => t.title),
    ).toContain('later today');
    expect(
      filterTasks(sample, { ...NO_FILTERS, period: 'month' }, now).map((t) => t.title),
    ).not.toContain('next week');
  });
  it('filters by source, priority and assignee', () => {
    expect(filterTasks(sample, { ...NO_FILTERS, source: 'MANAGER' }, now)).toHaveLength(1);
    expect(filterTasks(sample, { ...NO_FILTERS, priority: 'HIGH' }, now)[0]!.title).toBe(
      'next week',
    );
    expect(filterTasks(sample, { ...NO_FILTERS, assignee: 'Karimov' }, now)).toHaveLength(1);
  });
  it('lists distinct assignees', () => {
    expect(distinctAssignees([...sample, task({ assignee: 'Aliyev' })])).toEqual([
      'Aliyev',
      'Karimov',
    ]);
  });
});

describe('datetime-local conversion', () => {
  it('round-trips at minute precision', () => {
    const iso = at(28, 14, 30);
    expect(toLocalInput(iso)).toBe('2026-10-28T14:30');
    expect(fromLocalInput('2026-10-28T14:30')).toBe(iso);
    expect(toLocalInput(null)).toBe('');
    expect(fromLocalInput('')).toBeNull();
  });
});
