import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  Mail,
  MessageCircle,
  Send,
  ShieldCheck,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react';
import type { Task } from '@ish-maydoni/shared';
import { Button, Card, Chip, EmptyState, Skeleton } from '../../components';
import { dueLabel, isOverdue, resolveActionUrl, todayTasks, attentionTasks } from '../../lib/home';
import { formatTime } from '../../lib/format';
import { t, tf } from '../../lib/i18n';
import { SAMPLE_MEETINGS, SAMPLE_MESSAGES, type SampleMessage } from '../../lib/sample';
import { useData, type Slice } from '../../state/data';

export const SOURCE_KEY = {
  PLAN: 'source.PLAN',
  MANAGER: 'source.MANAGER',
  PERSONAL: 'source.PERSONAL',
  MODULE: 'source.MODULE',
} as const;

function ErrorBlock({ onRetry }: { onRetry?: () => void }) {
  return (
    <EmptyState
      icon={TriangleAlert}
      title={t('state.error')}
      description={t('state.errorText')}
      actions={onRetry && <Button onClick={onRetry}>{t('common.retry')}</Button>}
    />
  );
}

function RowsSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="stack" style={{ gap: 'var(--space-3)' }}>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="row" style={{ flexWrap: 'nowrap' }}>
          <Skeleton width={18} height={18} radius={4} />
          <Skeleton width={`${70 - i * 12}%`} height={14} />
        </div>
      ))}
    </div>
  );
}

const retry = () => void useData.getState().loadAll();

/** "Diqqat talab qiladi" — overdue or due today, at most five. */
export function AttentionCard({ tasks, now }: { tasks: Slice<Task[]>; now: Date }) {
  const items = tasks.data ? attentionTasks(tasks.data, now) : [];
  return (
    <Card
      aria-busy={tasks.status === 'loading'}
      title={
        <span className="row" style={{ gap: 'var(--space-2)' }}>
          {t('home.attention')}
          {items.length > 0 && <Chip tone="danger">{items.length}</Chip>}
        </span>
      }
    >
      {tasks.status === 'loading' && <RowsSkeleton />}
      {tasks.status === 'error' && <ErrorBlock onRetry={retry} />}
      {tasks.status === 'ready' && items.length === 0 && (
        <EmptyState
          icon={CheckCircle2}
          tone="success"
          title={t('home.attention.empty')}
          description={t('home.attention.emptyText')}
        />
      )}
      {items.length > 0 && (
        <ul className="list">
          {items.map((task) => {
            const late = isOverdue(task, now);
            return (
              <li key={task.id} className="list__row">
                <div className="list__main">
                  <div className="list__title">{task.title}</div>
                  <div className="t-caption">{dueLabel(task, now)}</div>
                </div>
                <Chip tone={late ? 'danger' : 'warning'}>
                  {late ? t('due.overdue') : t('due.today')}
                </Chip>
                <Link to="/tasks" className="btn btn--secondary">
                  {t('home.attention.open')}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

/** "Bugungi vazifalar" with optimistic checkboxes. */
export function TodayTasksCard({ tasks, now }: { tasks: Slice<Task[]>; now: Date }) {
  const items = tasks.data ? todayTasks(tasks.data, now) : [];
  const allDone = items.length > 0 && items.every((x) => x.status === 'DONE');
  return (
    <Card
      title={t('home.today')}
      action={<Link to="/tasks">{t('common.more')} →</Link>}
      aria-busy={tasks.status === 'loading'}
    >
      {tasks.status === 'loading' && <RowsSkeleton rows={4} />}
      {tasks.status === 'error' && <ErrorBlock onRetry={retry} />}
      {tasks.status === 'ready' && items.length === 0 && (
        <EmptyState
          icon={CheckCircle2}
          title={t('home.today.empty')}
          description={t('home.today.emptyText')}
        />
      )}
      {allDone && (
        <p className="t-caption" style={{ marginBottom: 'var(--space-3)' }}>
          {t('home.today.allDone')}
        </p>
      )}
      {items.length > 0 && (
        <ul className="list">
          {items.map((task) => {
            const done = task.status === 'DONE';
            const id = `task-${task.id}`;
            return (
              <li key={task.id} className="list__row">
                <input
                  id={id}
                  type="checkbox"
                  className="check"
                  checked={done}
                  onChange={() => void useData.getState().toggleTask(task.id)}
                />
                <label htmlFor={id} className={done ? 'list__main list__main--done' : 'list__main'}>
                  <span className="list__title">{task.title}</span>
                  <span className="t-caption">{t(SOURCE_KEY[task.source])}</span>
                </label>
                <span className="mono t-caption">{formatTime(new Date(task.dueAt!))}</span>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

const MSG_ICON: Record<SampleMessage['app'], { icon: LucideIcon; color: string; to: string }> = {
  telegram: { icon: Send, color: 'var(--app-telegram)', to: '/browser?app=telegram' },
  whatsapp: { icon: MessageCircle, color: 'var(--app-whatsapp)', to: '/browser?app=whatsapp' },
  mail: { icon: Mail, color: 'var(--app-mail)', to: '/browser' },
};

export function SampleMarker() {
  return <Chip>{t('home.sample')}</Chip>;
}

/** Messages have no server source yet, so this block shows sample data and says so. */
export function MessagesCard() {
  return (
    <Card title={t('home.messages')} action={<SampleMarker />}>
      <ul className="list">
        {SAMPLE_MESSAGES.map((m) => {
          const { icon: Icon, color, to } = MSG_ICON[m.app];
          return (
            <li key={m.app} className="list__row">
              <span
                className="nav-item__tile app-tile"
                style={{ background: color }}
                aria-hidden="true"
              >
                <Icon size={18} strokeWidth={1.8} />
              </span>
              <Link to={to} className="list__main list__link">
                <span className="list__title">{m.from}</span>
                <span className="t-caption">{m.count > 0 ? m.text : t('home.messages.none')}</span>
              </Link>
              {m.count > 0 && <Chip tone="danger">{tf('home.messages.new', { n: m.count })}</Chip>}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

export function ScheduleCard() {
  return (
    <Card title={t('home.schedule')} action={<SampleMarker />}>
      {SAMPLE_MEETINGS.length === 0 ? (
        <EmptyState icon={ShieldCheck} title={t('home.schedule.empty')} />
      ) : (
        <ul className="list">
          {SAMPLE_MEETINGS.map((m) => (
            <li key={m.time} className="list__row">
              <span className="mono list__time">{m.time}</span>
              <span className="list__main">
                <span className="list__title">{m.title}</span>
              </span>
              {m.online && (
                <Link to="/browser" className="btn btn--secondary">
                  {t('home.schedule.join')}
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

const hhmm = (ms: number) => formatTime(new Date(ms));

export function WidgetsCard() {
  const weather = useData((s) => s.weather);
  const currency = useData((s) => s.currency);
  const note = (slice: Slice<{ stale: boolean }>) =>
    slice.updatedAt
      ? tf(slice.data?.stale ? 'home.stale' : 'home.updated', { time: hhmm(slice.updatedAt) })
      : '';
  return (
    <Card
      title={t('home.weather')}
      aria-busy={weather.status === 'loading' || currency.status === 'loading'}
    >
      {weather.status === 'loading' && <Skeleton height={44} radius={10} />}
      {weather.status === 'error' && <p className="t-caption">{t('state.errorText')}</p>}
      {weather.data && (
        <div className="weather">
          <span className="weather__temp">{weather.data.temperature}°</span>
          <div>
            <div className="list__title">
              {weather.data.city} · {weather.data.description}
            </div>
            <div className="t-caption">
              {tf('home.tomorrow', { n: weather.data.tomorrowMax })} ·{' '}
              <span className="mono">{note(weather)}</span>
            </div>
          </div>
        </div>
      )}
      <h3 className="t-section widgets__sub">
        {t('home.currency')} · {t('home.currency.source')}
      </h3>
      {currency.status === 'loading' && <RowsSkeleton />}
      {currency.status === 'error' && <ErrorBlock onRetry={retry} />}
      {currency.data && (
        <>
          <ul className="list">
            {currency.data.items.slice(0, 3).map((c) => (
              <li key={c.code} className="list__row">
                <span className="list__main">
                  <span className="list__title">{c.code}</span>
                </span>
                <span className="mono">
                  {c.rate.toLocaleString('uz-UZ', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
                <span className={c.diff >= 0 ? 'diff diff--up' : 'diff diff--down'}>
                  {c.diff >= 0 ? '↑' : '↓'} {Math.abs(c.diff).toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
          <p className="t-caption mono">{note(currency)}</p>
        </>
      )}
    </Card>
  );
}
