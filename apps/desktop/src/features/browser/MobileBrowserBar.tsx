import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Grid2x2, Home, ListChecks, Menu, Plus, User, X } from 'lucide-react';
import { Button, Drawer } from '../../components';
import { t } from '../../lib/i18n';
import { useBrowser, type Tab } from '../../state/browser';
import { AddressBar } from './AddressBar';

/** Phone layout: address bar at the bottom (thumb reach), plus a tab switcher and the app menu as sheets. */
export function MobileBrowserBar({
  tab,
  inputRef,
}: {
  tab: Tab | undefined;
  inputRef: React.RefObject<HTMLInputElement | null>;
}) {
  const tabs = useBrowser((s) => s.tabs);
  const [sheet, setSheet] = useState<'tabs' | 'menu' | null>(null);
  const close = () => setSheet(null);
  return (
    <div className="mobilebar">
      <AddressBar tab={tab} compact inputRef={inputRef} />
      <div className="mobilebar__tools">
        <Button
          variant="ghost"
          onClick={() => setSheet('tabs')}
          aria-label={`${t('browser.tabs')}: ${tabs.length}`}
        >
          <Grid2x2 size={18} aria-hidden="true" /> {tabs.length}
        </Button>
        <Button
          variant="ghost"
          icon={Plus}
          onClick={() => useBrowser.getState().openTab()}
          aria-label={t('browser.newTab')}
        >
          {t('browser.newTab')}
        </Button>
        <Button variant="ghost" icon={Menu} onClick={() => setSheet('menu')}>
          {t('browser.menu')}
        </Button>
      </div>

      <Drawer open={sheet === 'tabs'} onClose={close} title={t('browser.tabs')}>
        <ul className="list">
          {tabs.map((x) => (
            <li key={x.id} className="list__row">
              <button
                type="button"
                className="list__main recent"
                aria-current={x.id === tab?.id ? 'true' : undefined}
                onClick={() => {
                  useBrowser.getState().activate(x.id);
                  close();
                }}
              >
                <span className="list__title">{x.title || x.url || t('browser.newTabTitle')}</span>
                <span className="t-caption">{x.url}</span>
              </button>
              <button
                type="button"
                className="icon-btn"
                aria-label={t('browser.closeTab')}
                onClick={() => useBrowser.getState().closeTab(x.id)}
              >
                <X size={18} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      </Drawer>

      <Drawer open={sheet === 'menu'} onClose={close} title={t('browser.menu')}>
        <ul className="list">
          {[
            { to: '/', icon: Home, label: t('nav.home') },
            { to: '/tasks', icon: ListChecks, label: t('nav.tasks') },
            { to: '/m/edo', icon: Grid2x2, label: t('nav.modules') },
            { to: '/settings', icon: User, label: t('nav.profile') },
          ].map((l) => (
            <li key={l.to} className="list__row">
              <Link to={l.to} className="list__main list__link" onClick={close}>
                <span className="list__title row">
                  <l.icon size={18} aria-hidden="true" />
                  {l.label}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Drawer>
    </div>
  );
}
