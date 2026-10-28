import { Search } from 'lucide-react';
import { t } from '../lib/i18n';
import { formatDate, formatTime } from '../lib/format';
import { useNow } from '../lib/useNow';
import { TopbarActions } from './TopbarActions';

function Clock() {
  const now = useNow();
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
        <TopbarActions />
      </div>
    </header>
  );
}
