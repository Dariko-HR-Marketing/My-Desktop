import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase,
  FileText,
  Globe,
  ListChecks,
  Search,
  Sparkles,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { Chip } from '../../components';
import { t, type MessageKey } from '../../lib/i18n';
import {
  buildPalette,
  flatten,
  moveIndex,
  PALETTE_FILTERS,
  type PaletteAction,
  type PaletteFilter,
  type PaletteItem,
  type SectionKey,
} from '../../lib/palette';
import { useBrowser } from '../../state/browser';
import { useData } from '../../state/data';
import { useOverlay } from '../../state/overlay';
import { useToast } from '../../state/toast';
import { useUi } from '../../state/ui';
import { useEdoDocs } from '../modules/edo/useEdoDocs';
import { cx } from '../../lib/cx';
import './palette.css';

const SECTION_ICON: Record<SectionKey, LucideIcon> = {
  actions: Zap,
  tasks: ListChecks,
  docs: FileText,
  people: Briefcase,
  apps: Globe,
  web: Search,
  ai: Sparkles,
};

/** Ctrl+K dialog: one field that creates tasks, finds tasks/documents/apps and falls back to a web search. */
export function CommandPalette() {
  const open = useUi((s) => s.paletteOpen);
  const setOpen = useUi((s) => s.setPaletteOpen);
  const navigate = useNavigate();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<PaletteFilter>('all');
  const [active, setActive] = useState(0);
  const tasks = useData((s) => s.tasks.data);
  const docs = useEdoDocs(open);

  const sections = useMemo(
    () => buildPalette(query, { tasks: tasks ?? [], docs }, filter),
    [query, tasks, docs, filter],
  );
  const items = useMemo(() => flatten(sections), [sections]);

  // reset on open; native browser webviews must not paint over the dialog
  useEffect(() => {
    if (!open) return;
    setQuery('');
    setFilter('all');
    setActive(0);
    const previous = document.activeElement as HTMLElement | null;
    const release = useOverlay.getState().acquire();
    requestAnimationFrame(() => inputRef.current?.focus());
    return () => {
      release();
      previous?.focus?.();
    };
  }, [open]);

  useEffect(() => setActive(items.findIndex((i) => i.action.type !== 'disabled') || 0), [items]);

  if (!open) return null;
  const close = () => setOpen(false);

  function run(action: PaletteAction) {
    switch (action.type) {
      case 'createTask': {
        const p = action.parsed;
        useData.getState().createTask({
          title: p.title,
          dueAt: p.dueAt,
          priority: p.priority ?? undefined,
          assignee: p.assignee,
          list: p.list,
        });
        useToast.getState().push(t('palette.created'));
        break;
      }
      case 'navigate':
        navigate(action.to);
        break;
      case 'openApp':
        useBrowser.getState().openApp(action.key);
        navigate('/browser');
        break;
      case 'openUrl':
        useBrowser.getState().openTab({ url: action.url });
        navigate('/browser');
        break;
      case 'disabled':
        return;
    }
    close();
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => moveIndex(items, a, e.key === 'ArrowDown' ? 1 : -1));
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const i = PALETTE_FILTERS.indexOf(filter);
      setFilter(
        PALETTE_FILTERS[
          (i + (e.shiftKey ? -1 : 1) + PALETTE_FILTERS.length) % PALETTE_FILTERS.length
        ]!,
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const chosen: PaletteItem | undefined =
        e.ctrlKey || e.metaKey
          ? (items.find((i) => i.id === 'web-google') ?? items[active])
          : items[active];
      if (chosen) run(chosen.action);
    }
  }

  let flat = -1;
  return createPortal(
    <div className="palette-overlay" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <div
        className="palette"
        role="dialog"
        aria-modal="true"
        aria-label={t('palette.title')}
        onKeyDown={onKeyDown}
      >
        <div className="palette__search">
          <Search size={20} strokeWidth={1.8} aria-hidden="true" />
          <input
            ref={inputRef}
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-activedescendant={items[active] ? `${listId}-${items[active]!.id}` : undefined}
            aria-label={t('palette.title')}
            className="palette__input"
            placeholder={t('palette.placeholder')}
            value={query}
            autoComplete="off"
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="palette__filters" role="group" aria-label={t('palette.filters')}>
          {PALETTE_FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              className="palette__chip"
              aria-pressed={filter === f}
              onClick={() => {
                setFilter(f);
                inputRef.current?.focus();
              }}
            >
              <Chip tone={filter === f ? 'info' : 'neutral'}>
                {t(`palette.filter.${f}` as MessageKey)}
              </Chip>
            </button>
          ))}
        </div>

        <div
          className="palette__results"
          id={listId}
          role="listbox"
          aria-label={t('palette.results')}
        >
          {items.length === 0 && <p className="palette__empty">{t('palette.empty')}</p>}
          {sections.map((section) => {
            const Icon = SECTION_ICON[section.key];
            return (
              <div key={section.key} role="group" aria-label={t(section.label)}>
                <div className="t-overline palette__section">{t(section.label)}</div>
                {section.items.map((item) => {
                  flat += 1;
                  const index = flat;
                  const disabled = item.action.type === 'disabled';
                  return (
                    <div
                      key={item.id}
                      id={`${listId}-${item.id}`}
                      role="option"
                      aria-selected={index === active}
                      aria-disabled={disabled || undefined}
                      className={cx(
                        'palette__row',
                        index === active && 'palette__row--active',
                        disabled && 'palette__row--disabled',
                      )}
                      onMouseMove={() => !disabled && setActive(index)}
                      onClick={() => run(item.action)}
                    >
                      <span className="palette__icon" aria-hidden="true">
                        <Icon size={16} strokeWidth={1.8} />
                      </span>
                      <span className="palette__title">{item.title}</span>
                      {item.hint && <span className="t-caption">{item.hint}</span>}
                      {item.trailing && <kbd className="palette__trail">{item.trailing}</kbd>}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
        <div className="palette__foot t-caption">{t('palette.keys')}</div>
      </div>
    </div>,
    document.body,
  );
}
