import { forwardRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { Plus } from 'lucide-react';
import { Button, Chip } from '../../components';
import { t } from '../../lib/i18n';
import { parseQuickAdd, type QuickChip } from '../../lib/quickAdd';
import { useData } from '../../state/data';

const TONE: Record<QuickChip['kind'], 'info' | 'danger' | 'success' | 'neutral'> = {
  date: 'info',
  time: 'info',
  priority: 'danger',
  assignee: 'success',
  list: 'neutral',
};

/** One-line natural-language entry. Recognised parts show as chips while typing; Enter saves, Esc clears. */
export const QuickAdd = forwardRef<HTMLInputElement>(function QuickAdd(_props, ref) {
  const [value, setValue] = useState('');
  const parsed = parseQuickAdd(value, new Date());
  const hasText = value.trim().length > 0;
  const needTitle = hasText && parsed.title === '';

  function submit(e?: FormEvent) {
    e?.preventDefault();
    if (!parsed.title) return;
    useData.getState().createTask({
      title: parsed.title,
      dueAt: parsed.dueAt,
      priority: parsed.priority ?? undefined,
      assignee: parsed.assignee,
      list: parsed.list,
    });
    setValue('');
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      setValue('');
      e.currentTarget.blur();
    }
  }

  return (
    <form className="quick" onSubmit={submit} role="search" aria-label={t('tasks.new')}>
      <div className="quick__row">
        <label htmlFor="quick-add" className="sr-only">
          {t('tasks.quick.label')}
        </label>
        <input
          id="quick-add"
          ref={ref}
          className="input quick__input"
          value={value}
          placeholder={t('tasks.quick.placeholder')}
          autoComplete="off"
          aria-describedby="quick-hint"
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
        />
        <Button type="submit" variant="primary" icon={Plus} disabled={!parsed.title}>
          {t('tasks.add')}
        </Button>
      </div>
      <div className="quick__meta" id="quick-hint">
        {parsed.chips.length > 0 && (
          <span className="row" style={{ gap: 'var(--space-2)' }} aria-label="Ajratilgan qismlar">
            {parsed.chips.map((c) => (
              <Chip
                key={`${c.kind}-${c.start}`}
                tone={c.kind === 'priority' && c.label !== 'Yuqori' ? 'neutral' : TONE[c.kind]}
              >
                {c.label}
              </Chip>
            ))}
          </span>
        )}
        <span className="t-caption">
          {needTitle
            ? t('tasks.quick.needTitle')
            : hasText
              ? t('tasks.quick.hint')
              : t('tasks.quick.help')}
        </span>
      </div>
    </form>
  );
});
