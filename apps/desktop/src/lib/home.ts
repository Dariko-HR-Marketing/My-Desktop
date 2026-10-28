import type { Task } from '@ish-maydoni/shared';
import type { MessageKey } from './i18n';
import { tf, t } from './i18n';
import { formatDate, formatTime } from './format';

export interface TaskStats {
  today: number;
  todayDone: number;
  open: number;
  overdue: number;
}

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const isOpen = (t: Task) => t.status === 'TODO' || t.status === 'IN_PROGRESS';

export function greetingKey(hour: number): MessageKey {
  if (hour < 12) return 'greet.morning';
  if (hour < 18) return 'greet.day';
  return 'greet.evening';
}

export function firstName(fullName?: string | null): string {
  return (fullName ?? '').trim().split(/\s+/)[0] ?? '';
}

export function greeting(hour: number, fullName?: string | null): string {
  const name = firstName(fullName);
  const text = tf(greetingKey(hour), { name });
  return name ? text : text.replace(/,\s*$/, '');
}

/** Tasks due on the local calendar day of `now`, earliest first (done ones included, shown struck through). */
export function todayTasks(tasks: Task[], now: Date): Task[] {
  const start = startOfDay(now).getTime();
  const end = addDays(startOfDay(now), 1).getTime();
  return tasks
    .filter(
      (x) =>
        x.status !== 'CANCELLED' &&
        x.dueAt &&
        new Date(x.dueAt).getTime() >= start &&
        new Date(x.dueAt).getTime() < end,
    )
    .sort((a, b) => a.dueAt!.localeCompare(b.dueAt!));
}

export function computeTaskStats(tasks: Task[], now: Date): TaskStats {
  const today = todayTasks(tasks, now);
  const open = tasks.filter(isOpen);
  return {
    today: today.length,
    todayDone: today.filter((x) => x.status === 'DONE').length,
    open: open.length,
    overdue: open.filter((x) => x.dueAt && new Date(x.dueAt) < now).length,
  };
}

/** Open tasks that are overdue or due today; the most overdue first; at most `limit`. */
export function attentionTasks(tasks: Task[], now: Date, limit = 5): Task[] {
  const end = addDays(startOfDay(now), 1).getTime();
  return tasks
    .filter((x) => isOpen(x) && x.dueAt && new Date(x.dueAt).getTime() < end)
    .sort((a, b) => a.dueAt!.localeCompare(b.dueAt!))
    .slice(0, limit);
}

export const isOverdue = (task: Task, now: Date) =>
  isOpen(task) && !!task.dueAt && new Date(task.dueAt) < now;

/** "Bugun 14:00", "Kecha 18:00", "26-oktabr 09:00". */
export function dueLabel(task: Task, now: Date): string {
  if (!task.dueAt) return '';
  const due = new Date(task.dueAt);
  const days = Math.round((startOfDay(due).getTime() - startOfDay(now).getTime()) / 86_400_000);
  const when = days === 0 ? t('due.today') : days === -1 ? t('due.yesterday') : formatDate(due);
  return `${when} ${formatTime(due)}`;
}

export function summarySentence(stats: TaskStats, nextMeetingTime?: string | null): string {
  const parts: string[] = [];
  if (stats.open === 0) parts.push(t('summary.noTasks'));
  else {
    parts.push(tf('summary.tasksLeft', { n: stats.open }));
    if (stats.overdue > 0) parts.push(tf('summary.overdue', { n: stats.overdue }));
  }
  if (nextMeetingTime) parts.push(tf('summary.meeting', { time: nextMeetingTime }));
  return parts.join(' · ');
}

/** module://edo/documents → /m/edo/documents; web links are returned as-is. */
export function resolveActionUrl(url: string): { internal: boolean; to: string } {
  const m = /^module:\/\/([^/]+)(?:\/(.*))?$/.exec(url);
  if (m) return { internal: true, to: `/m/${m[1]}${m[2] ? `/${m[2]}` : ''}` };
  return { internal: false, to: url };
}

export const nextStatus = (task: Task): 'DONE' | 'TODO' =>
  task.status === 'DONE' ? 'TODO' : 'DONE';

/** Optimistic copy of a task after toggling its checkbox. */
export function toggled(task: Task, now: Date): Task {
  const status = nextStatus(task);
  return {
    ...task,
    status,
    completedAt: status === 'DONE' ? now.toISOString() : null,
    updatedAt: now.toISOString(),
  };
}
