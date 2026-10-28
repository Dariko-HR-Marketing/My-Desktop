import { useLocation, NavLink, Link } from 'react-router-dom';
import {
  ChevronDown,
  ChevronRight,
  Home,
  ListChecks,
  Globe,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  type LucideIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { IconButton, Tooltip } from '../components';
import { t, type MessageKey } from '../lib/i18n';
import type { NavMode } from '../lib/layout';
import { NETWORKS } from '../features/browser/networks';
import { modulesForRole } from '../features/modules/registry';
import { useSession } from '../state/session';
import { useUi } from '../state/ui';

function NavEntry({
  label,
  mode,
  children,
}: {
  label: string;
  mode: NavMode;
  children: ReactNode;
}) {
  return mode === 'rail' ? <Tooltip content={label}>{children as never}</Tooltip> : <>{children}</>;
}

function PageLink({
  to,
  icon: Icon,
  label,
  mode,
  end,
}: {
  to: string;
  icon: LucideIcon;
  label: MessageKey;
  mode: NavMode;
  end?: boolean;
}) {
  return (
    <NavEntry label={t(label)} mode={mode}>
      <NavLink
        to={to}
        end={end}
        className="nav-item"
        aria-label={mode === 'rail' ? t(label) : undefined}
      >
        <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
        <span className="nav-item__label">{t(label)}</span>
      </NavLink>
    </NavEntry>
  );
}

export function Sidebar({ mode }: { mode: Exclude<NavMode, 'bottom'> }) {
  const { navCollapsed, toggleNav, networksOpen, toggleNetworks } = useUi();
  const role = useSession((s) => s.user?.role ?? 'EMPLOYEE');
  const location = useLocation();
  const activeApp =
    location.pathname === '/browser' ? new URLSearchParams(location.search).get('app') : null;
  const rail = mode === 'rail';
  const showNetworks = rail || networksOpen;

  return (
    <aside className="sidebar" data-mode={mode} aria-label={t('nav.primary')}>
      <div className="sidebar__brand">
        <div className="sidebar__logo" aria-hidden="true">
          IM
        </div>
        <div className="sidebar__name">
          {t('app.name')}
          <span className="sidebar__org">{t('app.org')}</span>
        </div>
        {/* In forced-rail situations (laptop/tablet/browser) the button would be a no-op, so it only shows on desktop. */}
        {(mode === 'full' || navCollapsed) && (
          <IconButton
            label={rail ? t('nav.expand') : t('nav.collapse')}
            icon={rail ? PanelLeftOpen : PanelLeftClose}
            onClick={toggleNav}
            aria-expanded={!rail}
          />
        )}
      </div>

      <nav aria-label={t('nav.primary')}>
        <div className="sidebar__group">
          <div className="sidebar__group-title t-overline">
            <span>{t('nav.main')}</span>
          </div>
          <PageLink to="/" icon={Home} label="nav.home" mode={mode} end />
          <PageLink to="/tasks" icon={ListChecks} label="nav.tasks" mode={mode} />
          <NavEntry label={t('nav.browser')} mode={mode}>
            <NavLink
              to="/browser"
              className="nav-item"
              aria-label={rail ? t('nav.browser') : undefined}
              aria-current={location.pathname === '/browser' && !activeApp ? 'page' : undefined}
            >
              <Globe size={18} strokeWidth={1.8} aria-hidden="true" />
              <span className="nav-item__label">{t('nav.browser')}</span>
            </NavLink>
          </NavEntry>
        </div>

        <div className="sidebar__group">
          <div className="sidebar__group-title t-overline">
            <span>{t('nav.modules')}</span>
          </div>
          {modulesForRole(role).map((m) => (
            <NavEntry key={m.key} label={t(m.name)} mode={mode}>
              <NavLink
                to={`/m/${m.key}`}
                className="nav-item"
                aria-label={rail ? t(m.name) : undefined}
              >
                <m.icon size={18} strokeWidth={1.8} aria-hidden="true" />
                <span className="nav-item__label">
                  {t(m.name)}
                  <span className="nav-item__sub">{t(m.subtitle)}</span>
                </span>
              </NavLink>
            </NavEntry>
          ))}
        </div>

        <div className="sidebar__group">
          {rail ? (
            <div className="sidebar__divider" />
          ) : (
            <button
              type="button"
              className="sidebar__group-title t-overline"
              aria-expanded={networksOpen}
              onClick={toggleNetworks}
            >
              <span>{t('nav.networks')}</span>
              {networksOpen ? (
                <ChevronDown size={14} aria-hidden="true" />
              ) : (
                <ChevronRight size={14} aria-hidden="true" />
              )}
            </button>
          )}
          {showNetworks &&
            NETWORKS.map((n) => (
              <NavEntry key={n.key} label={t(n.name)} mode={mode}>
                <Link
                  to={`/browser?app=${n.key}`}
                  className="nav-item"
                  aria-label={rail ? t(n.name) : undefined}
                  aria-current={activeApp === n.key ? 'page' : undefined}
                >
                  <span
                    className="nav-item__tile"
                    style={{ background: n.color }}
                    aria-hidden="true"
                  >
                    <n.icon size={14} strokeWidth={1.8} />
                  </span>
                  <span className="nav-item__label">{t(n.name)}</span>
                </Link>
              </NavEntry>
            ))}
        </div>
      </nav>

      <div className="sidebar__spacer" />
      <div className="sidebar__group">
        <PageLink to="/settings" icon={Settings} label="nav.settings" mode={mode} />
      </div>
    </aside>
  );
}
