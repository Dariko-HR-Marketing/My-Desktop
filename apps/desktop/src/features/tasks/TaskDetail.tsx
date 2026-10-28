import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { TASK_PRIORITIES, TASK_STATUSES, type Task } from '@ish-maydoni/shared';
import { Button } from '../../components';
import { formatDate, formatTime } from '../../lib/format';
import { t, type MessageKey } from '../../lib/i18n';
import { fromLocalInput, toLocalInput } from '../../lib/tasks';
import { useData } from '../../state/data';
import { SOURCE_KEY } from '../home/blocks';

const blank = (v: string) => (v.trim() === '' ? null : v.trim());

/** Edits save on blur/change. Rendered with key={task.id} so inputs reset when another task is opened. */
export function TaskDetail({ task, onDeleted }: { task: Task; onDeleted(): void }) {
  const update = useData.getState().updateTask;
  const [confirm, setConfirm] = useState(false);
  const created = new Date(task.createdAt);

  return (
    <div className="detail stack">
      <div className="field">
        <label htmlFor="d-title">{t('tasks.detail.title')}</label>
        <input
          id="d-title"
          className="input"
          defaultValue={task.title}
          maxLength={500}
          onBlur={(e) => {
            const v = e.target.value.trim();
            if (v && v !== task.title) update(task.id, { title: v });
            else e.target.value = task.title;
          }}
        />
      </div>

      <div className="detail__grid">
        <div className="field">
          <label htmlFor="d-status">{t('tasks.detail.status')}</label>
          <select
            id="d-status"
            className="select"
            value={task.status}
            onChange={(e) => update(task.id, { status: e.target.value as Task['status'] })}
          >
            {TASK_STATUSES.map((s) => (
              <option key={s} value={s}>
                {t(`tasks.status.${s}` as MessageKey)}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="d-priority">{t('tasks.detail.priority')}</label>
          <select
            id="d-priority"
            className="select"
            value={task.priority}
            onChange={(e) => update(task.id, { priority: e.target.value as Task['priority'] })}
          >
            {TASK_PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {t(`tasks.priority.${p}` as MessageKey)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="field">
        <label htmlFor="d-due">{t('tasks.detail.due')}</label>
        <input
          id="d-due"
          type="datetime-local"
          className="input"
          defaultValue={toLocalInput(task.dueAt)}
          onBlur={(e) => {
            const next = fromLocalInput(e.target.value);
            if (next !== task.dueAt) update(task.id, { dueAt: next ? new Date(next) : null });
          }}
        />
      </div>

      <div className="detail__grid">
        <div className="field">
          <label htmlFor="d-assignee">{t('tasks.detail.assignee')}</label>
          <input
            id="d-assignee"
            className="input"
            defaultValue={task.assignee ?? ''}
            maxLength={100}
            onBlur={(e) =>
              blank(e.target.value) !== task.assignee &&
              update(task.id, { assignee: blank(e.target.value) })
            }
          />
        </div>
        <div className="field">
          <label htmlFor="d-list">{t('tasks.detail.list')}</label>
          <input
            id="d-list"
            className="input"
            defaultValue={task.list ?? ''}
            maxLength={100}
            onBlur={(e) =>
              blank(e.target.value) !== task.list &&
              update(task.id, { list: blank(e.target.value) })
            }
          />
        </div>
      </div>

      <div className="field">
        <label htmlFor="d-notes">{t('tasks.detail.notes')}</label>
        <textarea
          id="d-notes"
          className="input textarea"
          rows={4}
          defaultValue={task.notes ?? ''}
          onBlur={(e) =>
            blank(e.target.value) !== task.notes &&
            update(task.id, { notes: blank(e.target.value) })
          }
        />
      </div>

      <dl className="detail__facts">
        <dt>{t('tasks.detail.source')}</dt>
        <dd>{t(SOURCE_KEY[task.source])}</dd>
        {task.assignedBy && (
          <>
            <dt>{t('tasks.detail.assignedBy')}</dt>
            <dd>{task.assignedBy}</dd>
          </>
        )}
        <dt>{t('tasks.detail.created')}</dt>
        <dd className="mono">
          {formatDate(created)} {formatTime(created)}
        </dd>
      </dl>

      {confirm ? (
        <div className="row">
          <Button
            variant="danger-ghost"
            icon={Trash2}
            onClick={() => {
              useData.getState().removeTask(task.id);
              onDeleted();
            }}
          >
            {t('tasks.detail.confirmDelete')}
          </Button>
          <Button onClick={() => setConfirm(false)}>{t('common.close')}</Button>
        </div>
      ) : (
        <Button variant="danger-ghost" icon={Trash2} onClick={() => setConfirm(true)}>
          {t('tasks.detail.delete')}
        </Button>
      )}
    </div>
  );
}
