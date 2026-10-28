import { NavLink } from 'react-router-dom';
import { Globe, Grid2x2, Home, ListChecks, User, type LucideIcon } from 'lucide-react';
import { t, type MessageKey } from '../lib/i18n';

const ITEMS: { to: string; icon: LucideIcon; label: MessageKey; end?: boolean }[] = [
  { to: '/', icon: Home, label: 'nav.homeShort', end: true },
  { to: '/tasks', icon: ListChecks, label: 'nav.tasksShort' },
  { to: '/browser', icon: Globe, label: 'nav.browser' },
  { to: '/m/edo', icon: Grid2x2, label: 'nav.modulesShort' },
  { to: '/settings', icon: User, label: 'nav.profile' },
];

export function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label={t('nav.mobile')}>
      {ITEMS.map((it) => (
        <NavLink key={it.to} to={it.to} end={it.end} className="bottom-nav__item">
          <it.icon size={22} strokeWidth={1.8} aria-hidden="true" />
          {t(it.label)}
        </NavLink>
      ))}
    </nav>
  );
}
