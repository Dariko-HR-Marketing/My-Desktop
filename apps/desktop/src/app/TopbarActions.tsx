import { Link } from 'react-router-dom';
import { Bell, LogOut, Sparkles } from 'lucide-react';
import { IconButton } from '../components';
import { logout } from '../features/auth/auth';
import { initials } from '../lib/format';
import { t } from '../lib/i18n';
import { useData } from '../state/data';
import { useSession } from '../state/session';
import { useUi } from '../state/ui';

/** AI, notifications, sign-out and avatar: the same cluster in the top bar and in the browser's address bar. */
export function TopbarActions() {
  const user = useSession((s) => s.user);
  const unread = useData((s) => s.notifications.data?.unread ?? 0);
  const setOpen = useUi((s) => s.setNotificationsOpen);
  return (
    <>
      <IconButton
        className="topbar__ai"
        label={`${t('top.ai')} · ${t('top.soon')}`}
        icon={Sparkles}
        disabled
      />
      <IconButton
        label={t('top.notifications')}
        icon={Bell}
        badge={unread}
        onClick={() => setOpen(true)}
      />
      <IconButton label={t('auth.logout')} icon={LogOut} onClick={() => void logout()} />
      <Link to="/settings" className="avatar" aria-label={t('top.profile')}>
        {initials(user?.fullName)}
      </Link>
    </>
  );
}
