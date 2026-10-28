import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { t } from '../lib/i18n';
import { applyAppearance } from '../lib/appearance';
import { navModeFor, useBreakpoint } from '../lib/layout';
import { useUi } from '../state/ui';
import { BottomNav } from './BottomNav';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export function AppShell() {
  const bp = useBreakpoint();
  const { theme, density, navCollapsed } = useUi();
  const onBrowser = useLocation().pathname === '/browser';
  const nav = navModeFor(bp, navCollapsed, onBrowser);

  useEffect(() => applyAppearance(theme, density), [theme, density, bp]);

  return (
    <div className="shell" data-nav={nav} data-bp={bp}>
      <a href="#content" className="skip-link">
        {t('a11y.skip')}
      </a>
      {nav !== 'bottom' && <Sidebar mode={nav} />}
      <div className="shell__main">
        {/* The browser page replaces the top bar with its own tabs and address bar (stage 6). */}
        {!onBrowser && <Topbar />}
        <main id="content" tabIndex={-1} className="page">
          <Outlet />
        </main>
      </div>
      {nav === 'bottom' && <BottomNav />}
    </div>
  );
}
