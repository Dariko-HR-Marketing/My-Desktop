import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Skeleton } from '../components';
import { t } from '../lib/i18n';
import { useSession } from '../state/session';

/** Splash while the saved session is being restored, then the app or the login page. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const status = useSession((s) => s.status);
  const location = useLocation();
  if (status === 'loading') {
    return (
      <div className="splash" role="status" aria-label={t('auth.loading')} aria-busy="true">
        <Skeleton width={64} height={64} radius={16} />
        <Skeleton width={180} height={14} />
      </div>
    );
  }
  if (status === 'anon')
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  return <>{children}</>;
}
