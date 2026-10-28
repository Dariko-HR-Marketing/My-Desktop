import { useState } from 'react';
import { ListTodo } from 'lucide-react';
import type { EdoAssignment, EdoData } from '@ish-maydoni/shared';
import { Card, Chip, Drawer, EmptyState } from '../../../components';
import { cx } from '../../../lib/cx';
import { formatDate, formatTime } from '../../../lib/format';
import { useNow } from '../../../lib/useNow';
import { COLUMNS, leftLabel } from './edoLogic';
import { te, type EdoKey } from './messages';

const dueText = (a: EdoAssignment) =>
  a.due ? `${formatDate(new Date(a.due))} ${formatTime(new Date(a.due))}` : '—';

function Detail({ a, now }: { a: EdoAssignment; now: Date }) {
  return (
    <div className="stack">
      <div className="row">
        <Chip tone={a.priority === 'HIGH' ? 'danger' : 'neutral'}>
          {te(`priority.${a.priority}` as EdoKey)}
        </Chip>
        {a.due && a.column !== 'DONE' && (
          <Chip tone={new Date(a.due) < now ? 'danger' : 'neutral'}>{leftLabel(a.due, now)}</Chip>
        )}
      </div>
      <dl className="detail__facts">
        <dt>{te('board.detail.due')}</dt>
        <dd className="mono">{dueText(a)}</dd>
        <dt>{te('board.detail.column')}</dt>
        <dd>{te(`board.${a.column}` as EdoKey)}</dd>
        <dt>{te('board.detail.source')}</dt>
        <dd>{a.source}</dd>
        {a.assignedBy && (
          <>
            <dt>{te('board.detail.from')}</dt>
            <dd>{a.assignedBy}</dd>
          </>
        )}
        <dt>{te('board.detail.who')}</dt>
        <dd>{a.who}</dd>
      </dl>
      {a.description && <p>{a.description}</p>}
      <div
        className="progress"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={a.stepsTotal}
        aria-valuenow={a.stepsDone}
        aria-label={te('board.steps', { a: a.stepsDone, b: a.stepsTotal })}
      >
        <div
          className="progress__bar"
          style={{ width: `${(a.stepsDone / Math.max(1, a.stepsTotal)) * 100}%` }}
        />
      </div>
      <span className="t-caption">{te('board.steps', { a: a.stepsDone, b: a.stepsTotal })}</span>
    </div>
  );
}

/** Kanban board: New → In progress → Review → Done. Read-only until the external system is connected. */
export function Assignments({ data }: { data: EdoData }) {
  const now = useNow();
  const [openId, setOpenId] = useState<string | null>(null);
  const current = data.assignments.find((a) => a.id === openId) ?? null;

  return (
    <>
      <div className="board">
        {COLUMNS.map((col) => {
          const items = data.assignments.filter((a) => a.column === col);
          return (
            <section key={col} className="board__col" aria-label={te(`board.${col}` as EdoKey)}>
              <h2 className="board__head">
                {te(`board.${col}` as EdoKey)} <Chip>{items.length}</Chip>
              </h2>
              {items.length === 0 && <EmptyState icon={ListTodo} title={te('board.empty')} />}
              <ul className="board__cards">
                {items.map((a) => {
                  const late = !!a.due && new Date(a.due) < now && a.column !== 'DONE';
                  return (
                    <li key={a.id}>
                      <button
                        type="button"
                        className={cx('card', 'bcard', late && 'bcard--late')}
                        onClick={() => setOpenId(a.id)}
                      >
                        <span className="t-caption">{a.source}</span>
                        <span className="list__title">{a.title}</span>
                        <span className="bcard__meta t-caption">
                          <span className={cx('mono', late && 'task__due--late')}>
                            {dueText(a)}
                          </span>
                          <span>{te('board.steps', { a: a.stepsDone, b: a.stepsTotal })}</span>
                          {a.priority === 'HIGH' && (
                            <Chip tone="danger">{te('priority.HIGH')}</Chip>
                          )}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
      <Drawer
        open={!!current}
        onClose={() => setOpenId(null)}
        title={current?.title ?? te('board.title')}
      >
        {current && <Detail a={current} now={now} />}
      </Drawer>
    </>
  );
}
