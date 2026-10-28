import { useState, type FormEvent } from 'react';
import { Link2, Search } from 'lucide-react';
import { Chip } from '../../components';
import { normalizeAddress } from '../../lib/browser';
import { formatDate, formatTime } from '../../lib/format';
import { t } from '../../lib/i18n';
import { useNow } from '../../lib/useNow';
import { useBrowser, type Tab } from '../../state/browser';
import { useData } from '../../state/data';
import { useToast } from '../../state/toast';
import { NETWORKS } from './networks';
import { EXTRA_TILES, WORK_SITES } from './sites';
import { useMemo } from 'react';
import { selectUnreadByApp } from '../../state/browser';

const WEEKDAYS = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];

export function NewTabPage({ tab }: { tab: Tab }) {
  const now = useNow();
  const [query, setQuery] = useState('');
  const weather = useData((s) => s.weather.data);
  const recent = useBrowser((s) => s.recent);
  const tabs = useBrowser((s) => s.tabs);
  const unread = useMemo(() => selectUnreadByApp(tabs), [tabs]);
  const open = (url: string) => useBrowser.getState().navigate(tab.id, url);

  function submit(e: FormEvent) {
    e.preventDefault();
    const target = normalizeAddress(query);
    if (target.kind === 'invalid') {
      if (query.trim()) useToast.getState().push(t('browser.badAddress'));
      return;
    }
    open(target.url);
  }

  const tiles = [
    ...NETWORKS.map((n) => ({
      key: n.key,
      name: t(n.name),
      url: n.url,
      color: n.color,
      icon: n.icon,
    })),
    ...EXTRA_TILES.map((x) => ({
      key: x.key,
      name: t(x.name),
      url: x.url,
      color: x.color,
      icon: Link2,
    })),
  ];

  return (
    <div className="start">
      <div className="start__inner">
        <div className="start__clock">
          <span className="mono start__time">{formatTime(now)}</span>
          <span className="t-caption">
            {WEEKDAYS[now.getDay()]}, {formatDate(now)}
            {weather && ` · ${weather.city} ${weather.temperature}°`}
          </span>
        </div>

        <form onSubmit={submit} role="search" className="start__search">
          <Search size={20} strokeWidth={1.8} aria-hidden="true" />
          <label htmlFor="start-search" className="sr-only">
            {t('browser.start.search')}
          </label>
          <input
            id="start-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('browser.start.searchPlaceholder')}
            autoComplete="off"
            autoFocus
          />
        </form>
        <div className="segmented" role="group" aria-label={t('browser.start.mode')}>
          <button type="button" aria-pressed="true">
            {t('browser.start.web')}
          </button>
          <button type="button" aria-pressed="false" disabled title={t('top.soon')}>
            {t('browser.start.org')}
          </button>
        </div>

        <section aria-labelledby="start-networks">
          <h2 id="start-networks" className="t-overline start__h">
            {t('browser.start.networks')}
          </h2>
          <ul className="tiles">
            {tiles.map((x) => (
              <li key={x.key}>
                <button type="button" className="tile" onClick={() => open(x.url)}>
                  <span className="tile__icon" style={{ background: x.color }} aria-hidden="true">
                    <x.icon size={22} strokeWidth={1.8} />
                  </span>
                  <span>{x.name}</span>
                  {unread[x.key] ? <Chip tone="danger">{unread[x.key]}</Chip> : null}
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="start-work">
          <h2 id="start-work" className="t-overline start__h">
            {t('browser.start.work')}
          </h2>
          <ul className="chips-list">
            {WORK_SITES.map((s) => (
              <li key={s.key}>
                <button type="button" className="site" onClick={() => open(s.url)}>
                  {s.name}
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="start-recent">
          <h2 id="start-recent" className="t-overline start__h">
            {t('browser.start.recent')}
          </h2>
          {recent.length === 0 ? (
            <p className="t-caption">{t('browser.start.recentEmpty')}</p>
          ) : (
            <ul className="list">
              {recent.map((r) => (
                <li key={r.url} className="list__row">
                  <button type="button" className="list__main recent" onClick={() => open(r.url)}>
                    <span className="list__title">{r.title}</span>
                    <span className="t-caption">{r.url}</span>
                  </button>
                  <span className="mono t-caption">{formatTime(new Date(r.at))}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
