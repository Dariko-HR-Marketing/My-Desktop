import { useEffect, useState, type DragEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { invoke } from '@tauri-apps/api/core';
import { ArrowDown, ArrowUp, GripVertical, Lock } from 'lucide-react';
import type { UserSettings } from '@ish-maydoni/shared';
import { Button, Card, IconButton, Switch } from '../../components';
import { cx } from '../../lib/cx';
import { APP_VERSION, serverUrl } from '../../lib/config';
import { t, tf, type MessageKey } from '../../lib/i18n';
import { useBreakpoint, type Density, type Theme } from '../../lib/layout';
import { isTauri } from '../../lib/platform';
import { checkForUpdate, installUpdate, type UpdateCheck } from '../../lib/updater';
import { movePinned, togglePinned, visibleAppKeys } from '../../lib/settings';
import { adoptServerSettings, updateSettings, useSettings } from '../../lib/settingsSync';
import { ApiError } from '../../lib/api';
import { api } from '../../lib/client';
import { useData } from '../../state/data';
import { useSession } from '../../state/session';
import { APPS, appByKey } from '../browser/networks';
import { useBrowser } from '../../state/browser';
import { useToast } from '../../state/toast';
import './settings.css';

const SECTIONS = [
  'appearance',
  'menu',
  'notifications',
  'calendar',
  'language',
  'browser',
  'system',
] as const;
type Section = (typeof SECTIONS)[number];

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: MessageKey }[];
  onChange(v: T): void;
}) {
  return (
    <div role="group" aria-label={label} className="segmented">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
        >
          {t(o.label)}
        </button>
      ))}
    </div>
  );
}

function Field({
  label,
  children,
  note,
}: {
  label: string;
  children: React.ReactNode;
  note?: string;
}) {
  return (
    <div className="stack" style={{ gap: 'var(--space-2)' }}>
      <span className="t-section">{label}</span>
      {children}
      {note && <span className="t-caption">{note}</span>}
    </div>
  );
}

const THEME_OPTIONS: { value: Theme; label: MessageKey }[] = [
  { value: 'light', label: 'settings.theme.light' },
  { value: 'dark', label: 'settings.theme.dark' },
  { value: 'system', label: 'settings.theme.system' },
];

/** A small mock-up of the app, drawn with the theme/density it is told to use. */
function MiniPreview({
  theme,
  density,
  label,
}: {
  theme: 'light' | 'dark';
  density: Density;
  label?: string;
}) {
  return (
    <div
      className="mini"
      data-preview-theme={theme}
      data-preview-density={density === 'compact' ? 'compact' : undefined}
      aria-hidden={label ? undefined : 'true'}
    >
      <div className="mini__nav" />
      <div className="mini__body">
        <div className="mini__bar" />
        <div className="mini__card">
          <div className="mini__title" />
          <div className="mini__row" />
          <div className="mini__row mini__row--short" />
        </div>
      </div>
    </div>
  );
}

function ThemeCards({ value, onChange }: { value: Theme; onChange(v: Theme): void }) {
  return (
    <div role="radiogroup" aria-label={t('settings.theme')} className="themecards">
      {THEME_OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          className={cx('themecard', value === o.value && 'themecard--on')}
          onClick={() => onChange(o.value)}
        >
          {o.value === 'system' ? (
            <span className="themecard__split">
              <MiniPreview theme="light" density="comfortable" />
              <MiniPreview theme="dark" density="comfortable" />
            </span>
          ) : (
            <MiniPreview theme={o.value} density="comfortable" />
          )}
          <span className="themecard__label">{t(o.label)}</span>
        </button>
      ))}
    </div>
  );
}

function MenuApps() {
  const s = useSettings();
  const pinned = visibleAppKeys(s.pinnedApps, APPS);
  const rest = APPS.filter((a) => !pinned.includes(a.key));
  const [drag, setDrag] = useState<string | null>(null);

  const reorder = (from: string, to: string) => {
    if (from === to) return;
    const list = s.pinnedApps.filter((k) => k !== from);
    const at = list.indexOf(to);
    list.splice(at < 0 ? list.length : at, 0, from);
    updateSettings({ pinnedApps: list });
  };

  const row = (key: string, on: boolean) => {
    const app = appByKey(key)!;
    const locked = app.mandatory;
    const index = s.pinnedApps.indexOf(key);
    return (
      <li
        key={key}
        className={cx('approw', drag === key && 'approw--drag')}
        draggable={on && !locked}
        onDragStart={(e: DragEvent) => {
          setDrag(key);
          e.dataTransfer.effectAllowed = 'move';
        }}
        onDragOver={(e) => on && drag && e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (drag) reorder(drag, key);
          setDrag(null);
        }}
        onDragEnd={() => setDrag(null)}
      >
        <span className="approw__grip" aria-hidden="true" title={t('settings.drag')}>
          <GripVertical size={16} />
        </span>
        <span className="nav-item__tile" style={{ background: app.color }} aria-hidden="true">
          <app.icon size={14} strokeWidth={1.8} />
        </span>
        <span className="approw__name">
          <span className="list__title">{t(app.name)}</span>
          {locked && (
            <span className="t-caption">
              <Lock size={12} aria-hidden="true" /> {t('settings.locked')}
            </span>
          )}
        </span>
        {on && index >= 0 && (
          <>
            <IconButton
              label={`${t('settings.moveUp')}: ${t(app.name)}`}
              icon={ArrowUp}
              disabled={index === 0}
              onClick={() => updateSettings({ pinnedApps: movePinned(s.pinnedApps, key, -1) })}
            />
            <IconButton
              label={`${t('settings.moveDown')}: ${t(app.name)}`}
              icon={ArrowDown}
              disabled={index === s.pinnedApps.length - 1}
              onClick={() => updateSettings({ pinnedApps: movePinned(s.pinnedApps, key, 1) })}
            />
          </>
        )}
        <Switch
          label={t(app.name)}
          checked={on}
          disabled={locked}
          onChange={(v) => updateSettings({ pinnedApps: togglePinned(s.pinnedApps, key, v) })}
        />
      </li>
    );
  };

  return (
    <div className="stack">
      <p className="t-caption">{t('settings.menuLead')}</p>
      <ul className="list apps">
        {pinned.map((k) => row(k, true))}
        {rest.map((a) => row(a.key, false))}
      </ul>
    </div>
  );
}

function UpdateRow() {
  const [state, setState] = useState<UpdateCheck | 'checking' | 'installing' | null>(null);
  if (!isTauri()) return null;
  return (
    <Field
      label={t('settings.update')}
      note={
        typeof state === 'object' && state?.status === 'none'
          ? t('settings.update.none')
          : typeof state === 'object' && state?.status === 'error'
            ? t('settings.update.error')
            : undefined
      }
    >
      <div className="row">
        {typeof state === 'object' && state?.status === 'available' ? (
          <Button
            variant="primary"
            onClick={() => {
              setState('installing');
              void installUpdate(state.update).catch(() => setState({ status: 'error' }));
            }}
          >
            {tf('settings.update.install', { v: state.version })}
          </Button>
        ) : (
          <Button
            disabled={state === 'checking' || state === 'installing'}
            onClick={() => {
              setState('checking');
              void checkForUpdate().then(setState);
            }}
          >
            {state === 'installing' ? t('settings.update.installing') : t('settings.update.check')}
          </Button>
        )}
      </div>
    </Field>
  );
}

function CalendarSection() {
  const s = useSettings();
  const demo = useSession((st) => st.demo);
  const [url, setUrl] = useState(s.calendarUrl);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<'connected' | 'removed' | null>(null);

  async function save(next: string) {
    setBusy(true);
    setError(null);
    setSaved(null);
    try {
      const result = await api.patch<UserSettings>('/api/settings', { calendarUrl: next });
      adoptServerSettings(result);
      setUrl(result.calendarUrl);
      setSaved(next ? 'connected' : 'removed');
      void useData.getState().refreshCalendar();
    } catch (err) {
      // a 400 carries the reason ("only https", "no private addresses"…); anything else is a connectivity problem
      setError(
        err instanceof ApiError && err.issues?.[0]?.message
          ? err.issues[0].message
          : t('calendar.failed'),
      );
    } finally {
      setBusy(false);
    }
  }

  if (demo) return <p>{t('calendar.demo')}</p>;
  return (
    <form
      className="stack"
      onSubmit={(e) => {
        e.preventDefault();
        void save(url.trim());
      }}
    >
      <Field label={t('calendar.label')} note={t('calendar.help')}>
        <input
          className="input"
          type="url"
          inputMode="url"
          autoComplete="off"
          spellCheck={false}
          aria-label={t('calendar.label')}
          placeholder="https://calendar.google.com/calendar/ical/…/basic.ics"
          value={url}
          aria-invalid={!!error}
          aria-describedby={error ? 'cal-err' : undefined}
          onChange={(e) => setUrl(e.target.value)}
        />
      </Field>
      {error && (
        <p id="cal-err" className="field__error" role="alert">
          {error}
        </p>
      )}
      {saved && (
        <p role="status" className="t-caption">
          {t(saved === 'connected' ? 'calendar.connected' : 'calendar.removed')}
        </p>
      )}
      <div className="row">
        <Button type="submit" variant="primary" disabled={busy || url.trim() === s.calendarUrl}>
          {t('calendar.save')}
        </Button>
        {s.calendarUrl && (
          <Button variant="danger-ghost" disabled={busy} onClick={() => void save('')}>
            {t('calendar.remove')}
          </Button>
        )}
      </div>
    </form>
  );
}

function SystemSection() {
  const [autostart, setAutostart] = useState<boolean | null>(null);
  const [url, setUrl] = useState(serverUrl());
  const desktop = isTauri();

  useEffect(() => {
    if (desktop)
      invoke<boolean>('autostart_get')
        .then(setAutostart)
        .catch(() => setAutostart(false));
  }, [desktop]);

  async function toggleAutostart(on: boolean) {
    setAutostart(on);
    try {
      await invoke('autostart_set', { enabled: on });
    } catch {
      setAutostart(!on);
      useToast.getState().push(t('state.undone'));
    }
  }

  function saveUrl() {
    if (!/^https?:\/\/[^\s/]+/.test(url.trim())) {
      useToast.getState().push(t('settings.serverBad'));
      return;
    }
    try {
      localStorage.setItem('ish-server-url', url.trim().replace(/\/+$/, ''));
    } catch {
      return;
    }
    useToast.getState().push(t('settings.serverSaved'));
    setTimeout(() => window.location.reload(), 800);
  }

  return (
    <div className="stack">
      <Field
        label={t('settings.autostart')}
        note={desktop ? undefined : t('settings.autostartDesktopOnly')}
      >
        <Switch
          label={t('settings.autostart')}
          checked={!!autostart}
          disabled={!desktop || autostart === null}
          onChange={(v) => void toggleAutostart(v)}
        />
      </Field>
      <UpdateRow />
      <Field label={t('settings.server')} note={t('settings.serverNote')}>
        <div className="row">
          <input
            className="input"
            style={{ flex: 1, minWidth: 220 }}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            aria-label={t('settings.server')}
            inputMode="url"
          />
          <Button onClick={saveUrl}>{t('settings.serverSave')}</Button>
        </div>
      </Field>
      <Field label={t('settings.privacy')}>
        <p>{t('settings.privacyText')}</p>
      </Field>
      <p className="t-caption">
        {t('settings.version')}: <span className="mono">{APP_VERSION}</span>
      </p>
    </div>
  );
}

export function SettingsPage() {
  const s = useSettings();
  const bp = useBreakpoint();
  const [params, setParams] = useSearchParams();
  const section = (SECTIONS.find((x) => x === params.get('s')) ?? 'appearance') as Section;
  const go = (k: Section) => setParams({ s: k }, { replace: true });

  const content: Record<Section, React.ReactNode> = {
    appearance: (
      <div className="stack">
        <Field label={t('settings.theme')}>
          <ThemeCards value={s.theme} onChange={(theme) => updateSettings({ theme })} />
        </Field>
        <Field label={t('settings.density')} note={t('settings.densityNote')}>
          <Segmented<Density>
            label={t('settings.density')}
            value={s.density}
            onChange={(density) => updateSettings({ density })}
            options={[
              { value: 'comfortable', label: 'settings.density.comfortable' },
              { value: 'compact', label: 'settings.density.compact' },
            ]}
          />
        </Field>
        <Field label={t('settings.fontSize')}>
          <Segmented<'sm' | 'md' | 'lg'>
            label={t('settings.fontSize')}
            value={s.fontSize}
            onChange={(fontSize) => updateSettings({ fontSize })}
            options={[
              { value: 'sm', label: 'settings.fontSize.sm' },
              { value: 'md', label: 'settings.fontSize.md' },
              { value: 'lg', label: 'settings.fontSize.lg' },
            ]}
          />
        </Field>
      </div>
    ),
    menu: <MenuApps />,
    notifications: (
      <div className="stack">
        <Field label={t('notif.quiet')} note={t('notif.quietHint')}>
          <Switch
            label={t('notif.quiet')}
            checked={s.quietEnabled}
            onChange={(v) => updateSettings({ quietEnabled: v })}
          />
        </Field>
        <div className="row">
          <label htmlFor="s-qf" className="t-caption">
            {t('settings.quietFrom')}
          </label>
          <input
            id="s-qf"
            type="time"
            className="input"
            disabled={!s.quietEnabled}
            value={s.quietFrom}
            onChange={(e) => e.target.value && updateSettings({ quietFrom: e.target.value })}
          />
          <label htmlFor="s-qt" className="t-caption">
            {t('settings.quietTo')}
          </label>
          <input
            id="s-qt"
            type="time"
            className="input"
            disabled={!s.quietEnabled}
            value={s.quietTo}
            onChange={(e) => e.target.value && updateSettings({ quietTo: e.target.value })}
          />
        </div>
      </div>
    ),
    calendar: <CalendarSection />,
    language: (
      <Field label={t('settings.language')}>
        <select
          className="select"
          aria-label={t('settings.language')}
          value={s.language}
          onChange={(e) => updateSettings({ language: e.target.value as typeof s.language })}
        >
          {(['uz-Latn', 'uz-Cyrl', 'ru', 'en'] as const).map((l) => (
            <option key={l} value={l} disabled={l !== 'uz-Latn'}>
              {t(`settings.language.${l}` as MessageKey)}
            </option>
          ))}
        </select>
      </Field>
    ),
    browser: (
      <div className="stack">
        <Field label={t('settings.sleep')} note={t('settings.sleepNote')}>
          <select
            className="select"
            aria-label={t('settings.sleep')}
            value={s.sleepMinutes}
            onChange={(e) => updateSettings({ sleepMinutes: Number(e.target.value) })}
          >
            {[5, 10, 20, 30, 60, 0].map((m) => (
              <option key={m} value={m}>
                {m === 0 ? t('settings.sleep.never') : tf('settings.sleep.min', { n: m })}
              </option>
            ))}
          </select>
        </Field>
        <div>
          <Button
            onClick={() => {
              useBrowser.setState({ recent: [] });
              useToast.getState().push(t('settings.cleared'));
            }}
          >
            {t('settings.clearRecent')}
          </Button>
        </div>
      </div>
    ),
    system: <SystemSection />,
  };

  return (
    <div className="settings">
      <div className="page__head">
        <h1 className="t-display">{t('settings.title')}</h1>
      </div>
      <div className="settings__cols" data-bp={bp}>
        <nav className="settings__nav" aria-label={t('settings.nav')}>
          {SECTIONS.map((k) => (
            <button
              key={k}
              type="button"
              className="settings__link"
              aria-current={k === section ? 'page' : undefined}
              onClick={() => go(k)}
            >
              {t(`settings.sec.${k}` as MessageKey)}
            </button>
          ))}
        </nav>
        <Card title={t(`settings.sec.${section}` as MessageKey)}>{content[section]}</Card>
        {bp === 'desktop' && (
          <aside aria-label={t('settings.preview')} className="settings__preview">
            <h2 className="t-overline">{t('settings.preview')}</h2>
            <div
              className="preview"
              data-preview-theme={
                s.theme === 'system'
                  ? window.matchMedia?.('(prefers-color-scheme: dark)').matches
                    ? 'dark'
                    : 'light'
                  : s.theme
              }
              data-preview-density={s.density === 'compact' ? 'compact' : undefined}
              data-font={s.fontSize}
            >
              <div className="preview__card">
                <div className="t-section">{t('settings.previewTitle')}</div>
                {[t('settings.previewTask1'), t('settings.previewTask2')].map((x) => (
                  <label key={x} className="preview__row">
                    <input type="checkbox" className="check" readOnly tabIndex={-1} /> {x}
                  </label>
                ))}
                <Button variant="primary" tabIndex={-1}>
                  {t('tasks.new')}
                </Button>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
