import type { Task } from '@ish-maydoni/shared';
import { Chip } from '../../components';
import { dueLabel, isOverdue } from '../../lib/home';
import { t } from '../../lib/i18n';
import { cx } from '../../lib/cx';
import { SOURCE_KEY } from '../home/blocks';

export function TaskRow({
  task,
  now,
  pending,
  selected,
  onToggle,
  onOpen,
}: {
  task: Task;
  now: Date;
  pending: boolean;
  selected: boolean;
  onToggle(): void;
  onOpen(): void;
}) {
  const done = task.status === 'DONE';
  const cancelled = task.status === 'CANCELLED';
  const id = `row-${task.id}`;
  const late = isOverdue(task, now);
  return (
    <li className={cx('task', selected && 'task--selected')}>
      <input
        id={id}
        type="checkbox"
        className="check"
        checked={done}
        disabled={cancelled}
        onChange={onToggle}
        aria-label={`${t(done ? 'home.today.markTodo' : 'home.today.markDone')}: ${task.title}`}
      />
      <button
        type="button"
        className="task__open"
        onClick={onOpen}
        aria-label={`${t('tasks.detail.open')}: ${task.title}`}
        aria-current={selected ? 'true' : undefined}
      >
        <span className={cx('list__title', (done || cancelled) && 'task__title--done')}>
          {task.title}
        </span>
        <span className="t-caption task__meta">
          {t(SOURCE_KEY[task.source])}
          {task.assignee && <> · @{task.assignee}</>}
          {task.list && <> · #{task.list}</>}
        </span>
      </button>
      {task.priority === 'HIGH' && !done && <Chip tone="danger">{t('tasks.priority.HIGH')}</Chip>}
      {task.priority === 'LOW' && !done && <Chip>{t('tasks.priority.LOW')}</Chip>}
      {pending && <Chip tone="warning">{t('tasks.queued')}</Chip>}
      {cancelled && <Chip>{t('tasks.status.CANCELLED')}</Chip>}
      {task.dueAt && (
        <span className={cx('mono t-caption task__due', late && 'task__due--late')}>
          {dueLabel(task, now)}
        </span>
      )}
    </li>
  );
}
