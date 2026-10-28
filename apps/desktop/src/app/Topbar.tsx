import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Search, Sparkles } from 'lucide-react';
import { IconButton } from '../components';
import { t } from '../lib/i18n';
import { formatDate, formatTime, initials } from '../lib/format';
import { useSession } from '../state/session';

function Clock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="topbar__clock">
      <span className="mono" style={{ fontWeight: 600 }}>
        {formatTime(now)}
      </span>
      <span className="t-caption">{formatDate(now)}</span>
    </div>
  );
}

export function Topbar() {
  const user = useSession((s) => s.user);
  return (
    <header className="topbar">
      {/* The palette itself arrives in stage 7; the field is already the real entry point. */}
      <button type="button" className="topbar__search" aria-label={t('top.search')}>
        <Search size={18} strokeWidth={1.8} aria-hidden="true" />
        <span className="topbar__search-text">{t('top.searchPlaceholder')}</span>
        <kbd className="topbar__kbd">Ctrl K</kbd>
      </button>
      <div className="topbar__right">
        <Clock />
        <IconButton
          className="topbar__ai"
          label={`${t('top.ai')} · ${t('top.soon')}`}
          icon={Sparkles}
          disabled
        />
        <IconButton label={t('top.notifications')} icon={Bell} />
        <Link to="/settings" className="avatar" aria-label={t('top.profile')}>
          {initials(user?.fullName)}
        </Link>
      </div>
    </header>
  );
}
