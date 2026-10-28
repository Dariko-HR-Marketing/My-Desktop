import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  CheckCircle2,
  MessageCircle,
  Send,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react';
import type { Task } from '@ish-maydoni/shared';
import { Button, Card, Chip, EmptyState, Skeleton } from '../../components';
import { dueLabel, isOverdue, resolveActionUrl, todayTasks, attentionTasks } from '../../lib/home';
import { formatTime } from '../../lib/format';
import { t, tf } from '../../lib/i18n';
import { appByKey } from '../browser/networks';
import { selectUnreadByApp, useBrowser } from '../../state/browser';
import { useSession } from '../../state/session';
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

const MESSENGERS: { key: 'telegram' | 'whatsapp'; icon: LucideIcon }[] = [
  { key: 'telegram', icon: Send },
  { key: 'whatsapp', icon: MessageCircle },
];

/** Shown on blocks that are demo-only (demo mode); real blocks never carry it. */
export function SampleMarker() {
  return <Chip>{t('home.sample')}</Chip>;
}

/**
 * Unread messages come from the messenger tabs of the internal browser (their page titles, "(12) Telegram"),
 * so the numbers are real, but only for messengers that have been opened in this app.
 */
export function MessagesCard() {
  const tabs = useBrowser((s) => s.tabs);
  const unread = useMemo(() => selectUnreadByApp(tabs), [tabs]);
  return (
    <Card title={t('home.messages')}>
      <ul className="list">
        {MESSENGERS.map(({ key, icon: Icon }) => {
          const app = appByKey(key)!;
          const opened = tabs.some((x) => x.appKey === key);
          const count = unread[key] ?? 0;
          return (
            <li key={key} className="list__row">
              <span
                className="nav-item__tile app-tile"
                style={{ background: app.color }}
                aria-hidden="true"
              >
                <Icon size={18} strokeWidth={1.8} />
              </span>
              <Link to={`/browser?app=${key}`} className="list__main list__link">
                <span className="list__title">{t(app.name)}</span>
                <span className="t-caption">
                  {!opened
                    ? t('home.messages.notOpened')
                    : count > 0
                      ? tf('home.messages.new', { n: count })
                      : t('home.messages.none')}
                </span>
              </Link>
              {count > 0 ? (
                <Chip tone="danger">{count}</Chip>
              ) : !opened ? (
                <span className="btn btn--secondary">{t('home.attention.open')}</span>
              ) : null}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

const clock = (iso: string) => formatTime(new Date(iso));

/** Today's events from the user's own calendar (iCalendar address in Settings). */
export function ScheduleCard({ now }: { now: Date }) {
  const slice = useData((s) => s.calendar);
  const demo = useSession((s) => s.demo);
  const navigate = useNavigate();
  const data = slice.data;

  function join(url: string) {
    useBrowser.getState().openTab({ url });
    navigate('/browser');
  }

  return (
    <Card
      title={t('home.schedule')}
      action={demo ? <SampleMarker /> : undefined}
      aria-busy={slice.status === 'loading'}
    >
      {slice.status === 'loading' && <RowsSkeleton />}
      {slice.status === 'error' && (
        <ErrorBlock onRetry={() => void useData.getState().refreshCalendar()} />
      )}
      {slice.status === 'ready' && data && !data.configured && (
        <EmptyState
          icon={CalendarDays}
          title={t('home.schedule.notConnected')}
          description={t('home.schedule.notConnectedText')}
          actions={
            <Link to="/settings?s=calendar" className="btn btn--primary">
              {t('home.schedule.connect')}
            </Link>
          }
        />
      )}
      {slice.status === 'ready' && data?.configured && data.items.length === 0 && (
        <EmptyState icon={CalendarDays} title={t('home.schedule.empty')} />
      )}
      {data?.configured && data.items.length > 0 && (
        <ul className="list">
          {data.items.map((e) => {
            const past = !e.allDay && new Date(e.end) < now;
            return (
              <li key={e.id} className={past ? 'list__row list__row--past' : 'list__row'}>
                <span className="mono list__time">
                  {e.allDay ? t('home.schedule.allDay') : clock(e.start)}
                </span>
                <span className="list__main">
                  <span className="list__title">{e.title}</span>
                  {(e.location || !e.allDay) && (
                    <span className="t-caption">
                      {[!e.allDay && `${clock(e.start)}–${clock(e.end)}`, e.location]
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                  )}
                </span>
                {e.joinUrl && !past && (
                  <button
                    type="button"
                    className="btn btn--secondary"
                    onClick={() => join(e.joinUrl!)}
                  >
                    {t('home.schedule.join')}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {data?.stale && (
        <p className="t-caption">
          {tf('home.stale', {
            time: slice.updatedAt ? formatTime(new Date(slice.updatedAt)) : '—',
          })}
        </p>
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
