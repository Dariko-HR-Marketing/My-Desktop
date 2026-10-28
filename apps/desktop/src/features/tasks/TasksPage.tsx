import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronDown, ChevronRight, ListChecks, Plus, TriangleAlert } from 'lucide-react';
import { TASK_PRIORITIES, TASK_SOURCES } from '@ish-maydoni/shared';
import { Button, Card, Chip, Drawer, EmptyState, Skeleton } from '../../components';
import { t, type MessageKey } from '../../lib/i18n';
import { useBreakpoint } from '../../lib/layout';
import {
  distinctAssignees,
  filterTasks,
  groupTasks,
  NO_FILTERS,
  type Period,
  type TaskFilters,
} from '../../lib/tasks';
import { useNow } from '../../lib/useNow';
import { useData } from '../../state/data';
import { SOURCE_KEY } from '../home/blocks';
import { QuickAdd } from './QuickAdd';
import { TaskDetail } from './TaskDetail';
import { TaskRow } from './TaskRow';
import './tasks.css';

function Select<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange(v: T): void;
  options: { value: T; label: string }[];
}) {
  const id = `f-${label}`;
  return (
    <div className="filter">
      <label htmlFor={id} className="t-caption">
        {label}
      </label>
      <select
        id={id}
        className="select"
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

const isTyping = (el: Element | null) =>
  !!el && (el.matches('input, textarea, select') || (el as HTMLElement).isContentEditable);

export function TasksPage() {
  const now = useNow();
  const bp = useBreakpoint();
  const tasks = useData((s) => s.tasks);
  const pending = useData((s) => s.pending);
  const [params, setParams] = useSearchParams();
  const [filters, setFilters] = useState<TaskFilters>(NO_FILTERS);
  const [open, setOpen] = useState({ overdue: true, today: true, upcoming: true, done: false });
  const quickRef = useRef<HTMLInputElement>(null);

  const selectedId = params.get('task');
  const selected = tasks.data?.find((x) => x.id === selectedId) ?? null;
  const setSelected = (id: string | null) =>
    setParams(
      (p) => {
        const next = new URLSearchParams(p);
        if (id) next.set('task', id);
        else next.delete('task');
        return next;
      },
      { replace: true },
    );

  // "Yangi vazifa" elsewhere links here with ?new=1; the N key focuses the field when not typing.
  useEffect(() => {
    if (params.get('new')) {
      quickRef.current?.focus();
      setParams(
        (p) => {
          const n = new URLSearchParams(p);
          n.delete('new');
          return n;
        },
        { replace: true },
      );
    }
  }, [params, setParams]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        e.key.toLowerCase() === 'n' &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey &&
        !isTyping(document.activeElement)
      ) {
        e.preventDefault();
        quickRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const all = tasks.data ?? [];
  const groups = useMemo(
    () => groupTasks(filterTasks(all, filters, now), now),
    [all, filters, now],
  );
  const assignees = useMemo(() => distinctAssignees(all), [all]);
  const filtered = JSON.stringify(filters) !== JSON.stringify(NO_FILTERS);
  const total =
    groups.overdue.length + groups.today.length + groups.upcoming.length + groups.done.length;

  const sections: { key: keyof typeof groups; label: MessageKey; tone?: 'danger' }[] = [
    { key: 'overdue', label: 'tasks.group.overdue', tone: 'danger' },
    { key: 'today', label: 'tasks.group.today' },
    { key: 'upcoming', label: 'tasks.group.upcoming' },
    { key: 'done', label: 'tasks.group.done' },
  ];

  const list = (
    <div className="stack">
      {tasks.status === 'loading' && (
        <Card aria-busy>
          <div className="stack" style={{ gap: 'var(--space-3)' }}>
            {[80, 60, 70, 50].map((w) => (
              <Skeleton key={w} width={`${w}%`} height={16} />
            ))}
          </div>
        </Card>
      )}
      {tasks.status === 'error' && (
        <Card>
          <EmptyState
            icon={TriangleAlert}
            title={t('state.error')}
            description={t('state.errorText')}
            actions={
              <Button onClick={() => void useData.getState().loadAll()}>{t('common.retry')}</Button>
            }
          />
        </Card>
      )}
      {tasks.status === 'ready' && total === 0 && (
        <Card>
          <EmptyState
            icon={ListChecks}
            title={filtered ? t('tasks.emptyFiltered') : t('tasks.empty')}
            description={filtered ? undefined : t('tasks.emptyText')}
            actions={
              filtered ? (
                <Button onClick={() => setFilters(NO_FILTERS)}>{t('tasks.filter.clear')}</Button>
              ) : undefined
            }
          />
        </Card>
      )}
      {sections.map(({ key, label, tone }) => {
        const items = groups[key];
        if (items.length === 0) return null;
        const isOpen = open[key];
        return (
          <section key={key} className="group">
            <h2 className="group__head">
              <button
                type="button"
                className="group__toggle"
                aria-expanded={isOpen}
                onClick={() => setOpen((o) => ({ ...o, [key]: !o[key] }))}
              >
                {isOpen ? (
                  <ChevronDown size={18} aria-hidden="true" />
                ) : (
                  <ChevronRight size={18} aria-hidden="true" />
                )}
                <span>{t(label)}</span>
                <Chip tone={tone ?? 'neutral'}>{items.length}</Chip>
              </button>
            </h2>
            {isOpen && (
              <ul className="list card group__list">
                {items.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    now={now}
                    pending={pending.has(task.id)}
                    selected={task.id === selectedId}
                    onToggle={() => useData.getState().toggleTask(task.id)}
                    onOpen={() => setSelected(task.id)}
                  />
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );

  const detail = selected && (
    <TaskDetail key={selected.id} task={selected} onDeleted={() => setSelected(null)} />
  );
  const sidePanel = bp === 'desktop';

  return (
    <div className="tasks">
      <div className="page__head">
        <h1 className="t-display">{t('tasks.title')}</h1>
        <Button icon={Plus} onClick={() => quickRef.current?.focus()}>
          {t('tasks.new')}
        </Button>
      </div>

      <QuickAdd ref={quickRef} />

      <div className="filters" role="group" aria-label={t('tasks.filter.period')}>
        <Select<Period>
          label={t('tasks.filter.period')}
          value={filters.period}
          onChange={(period) => setFilters((f) => ({ ...f, period }))}
          options={[
            { value: 'all', label: t('tasks.filter.all') },
            { value: 'today', label: t('tasks.period.today') },
            { value: 'week', label: t('tasks.period.week') },
            { value: 'month', label: t('tasks.period.month') },
          ]}
        />
        <Select
          label={t('tasks.filter.source')}
          value={filters.source}
          onChange={(source) => setFilters((f) => ({ ...f, source }))}
          options={[
            { value: 'all', label: t('tasks.filter.all') },
            ...TASK_SOURCES.map((s) => ({ value: s, label: t(SOURCE_KEY[s]) })),
          ]}
        />
        <Select
          label={t('tasks.filter.priority')}
          value={filters.priority}
          onChange={(priority) => setFilters((f) => ({ ...f, priority }))}
          options={[
            { value: 'all', label: t('tasks.filter.all') },
            ...TASK_PRIORITIES.map((p) => ({
              value: p,
              label: t(`tasks.priority.${p}` as MessageKey),
            })),
          ]}
        />
        <Select
          label={t('tasks.filter.assignee')}
          value={filters.assignee}
          onChange={(assignee) => setFilters((f) => ({ ...f, assignee }))}
          options={[
            { value: 'all', label: t('tasks.filter.all') },
            ...assignees.map((a) => ({ value: a, label: `@${a}` })),
          ]}
        />
        {filtered && (
          <Button variant="ghost" onClick={() => setFilters(NO_FILTERS)}>
            {t('tasks.filter.clear')}
          </Button>
        )}
      </div>

      {sidePanel ? (
        <div className="tasks__cols">
          {list}
          <aside className="tasks__panel" aria-label={t('tasks.detail.open')}>
            {detail ? <Card>{detail}</Card> : null}
          </aside>
        </div>
      ) : (
        <>
          {list}
          <Drawer
            open={!!selected}
            onClose={() => setSelected(null)}
            title={selected?.title ?? t('tasks.title')}
          >
            {detail}
          </Drawer>
        </>
      )}
    </div>
  );
}
