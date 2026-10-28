import type { Task, TaskPriority, TaskSource } from '@ish-maydoni/shared';

export type Period = 'all' | 'today' | 'week' | 'month';

export interface TaskFilters {
  period: Period;
  source: TaskSource | 'all';
  priority: TaskPriority | 'all';
  assignee: string | 'all';
}

export const NO_FILTERS: TaskFilters = {
  period: 'all',
  source: 'all',
  priority: 'all',
  assignee: 'all',
};

export interface TaskGroups {
  overdue: Task[];
  today: Task[];
  upcoming: Task[];
  done: Task[];
}

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const isOpen = (t: Task) => t.status === 'TODO' || t.status === 'IN_PROGRESS';
const byDue = (a: Task, b: Task) =>
  (a.dueAt ?? '￿').localeCompare(b.dueAt ?? '￿') || a.createdAt.localeCompare(b.createdAt);

function inPeriod(task: Task, period: Period, now: Date): boolean {
  if (period === 'all') return true;
  if (!task.dueAt) return false;
  const due = new Date(task.dueAt).getTime();
  const today = startOfDay(now);
  if (period === 'today') return due >= today.getTime() && due < addDays(today, 1).getTime();
  if (period === 'week') return due >= today.getTime() && due < addDays(today, 7).getTime();
  return (
    due >= today.getTime() && due < new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime()
  );
}

export function filterTasks(tasks: Task[], f: TaskFilters, now: Date): Task[] {
  return tasks.filter(
    (t) =>
      inPeriod(t, f.period, now) &&
      (f.source === 'all' || t.source === f.source) &&
      (f.priority === 'all' || t.priority === f.priority) &&
      (f.assignee === 'all' || t.assignee === f.assignee),
  );
}

/**
 * Overdue: open and past its due time. Today: open, due later today. Upcoming: open, later days or undated.
 * Done: completed or cancelled, newest first.
 */
export function groupTasks(tasks: Task[], now: Date): TaskGroups {
  const endOfToday = addDays(startOfDay(now), 1).getTime();
  const open = tasks.filter(isOpen).sort(byDue);
  return {
    overdue: open.filter((t) => t.dueAt && new Date(t.dueAt) < now),
    today: open.filter(
      (t) => t.dueAt && new Date(t.dueAt) >= now && new Date(t.dueAt).getTime() < endOfToday,
    ),
    upcoming: open.filter((t) => !t.dueAt || new Date(t.dueAt).getTime() >= endOfToday),
    done: tasks
      .filter((t) => !isOpen(t))
      .sort((a, b) => (b.completedAt ?? b.updatedAt).localeCompare(a.completedAt ?? a.updatedAt)),
  };
}

export const distinctAssignees = (tasks: Task[]): string[] =>
  [...new Set(tasks.map((t) => t.assignee).filter((a): a is string => !!a))].sort((a, b) =>
    a.localeCompare(b),
  );

/** `<input type="datetime-local">` value (local time, minute precision) ⇄ ISO string. */
export function toLocalInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function fromLocalInput(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}
