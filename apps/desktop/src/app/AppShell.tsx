import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Banner, Button, ToastHost } from '../components';
import { formatTime } from '../lib/format';
import { t, tf } from '../lib/i18n';
import { applyAppearance } from '../lib/appearance';
import { navModeFor, useBreakpoint } from '../lib/layout';
import { BrowserHost } from '../features/browser/BrowserHost';
import { NotificationsDrawer } from '../features/notifications/NotificationsDrawer';
import { CommandPalette } from '../features/search/CommandPalette';
import { cx } from '../lib/cx';
import { useData } from '../state/data';
import { useSession } from '../state/session';
import { useUi } from '../state/ui';
import { useDataSync } from './useDataSync';
import { BottomNav } from './BottomNav';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export function AppShell() {
  const bp = useBreakpoint();
  const { theme, density, navCollapsed, fontSize } = useUi();
  const onBrowser = useLocation().pathname === '/browser';
  const nav = navModeFor(bp, navCollapsed, onBrowser);
  const demo = useSession((s) => s.demo);
  const offline = useData((s) => s.offline);
  const lastSync = useData((s) => s.tasks.updatedAt);
  useDataSync();

  // Ctrl+K / Cmd+K opens the command palette from anywhere
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.altKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const ui = useUi.getState();
        ui.setPaletteOpen(!ui.paletteOpen);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => applyAppearance(theme, density, fontSize), [theme, density, fontSize, bp]);

  return (
    <div
      className="shell"
      data-nav={nav}
      data-bp={bp}
      data-browser={onBrowser ? 'true' : undefined}
    >
      <a href="#content" className="skip-link">
        {t('a11y.skip')}
      </a>
      {nav !== 'bottom' && <Sidebar mode={nav} />}
      <div className="shell__main">
        {/* The browser page replaces the top bar with its own tabs and address bar (stage 6). */}
        {!onBrowser && <Topbar />}
        {demo && <Banner>{t('state.demo')}</Banner>}
        {!demo && offline && (
          <Banner
            offline
            action={
              <Button onClick={() => void useData.getState().loadAll()}>{t('common.retry')}</Button>
            }
          >
            {tf('state.offline', { time: lastSync ? formatTime(new Date(lastSync)) : '—' })}
          </Banner>
        )}
        <main id="content" tabIndex={-1} className={cx('page', onBrowser && 'page--bleed')}>
          <Outlet />
        </main>
      </div>
      {nav === 'bottom' && !onBrowser && <BottomNav />}
      <BrowserHost />
      <NotificationsDrawer />
      <CommandPalette />
      <ToastHost />
    </div>
  );
}
