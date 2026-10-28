import { Suspense } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { Button, Card, EmptyState, ErrorBoundary, Skeleton } from '../../components';
import { t } from '../../lib/i18n';
import { useSession } from '../../state/session';
import { MODULES } from './registry';

export function ModulePage() {
  const { module: key } = useParams();
  const role = useSession((s) => s.user?.role ?? 'EMPLOYEE');
  const mod = MODULES.find((m) => m.key === key && m.roles.includes(role));

  if (!mod) {
    return (
      <Card>
        <EmptyState
          icon={Lock}
          title={t('page.module.unknown')}
          description={t('page.module.unknownLead')}
          actions={
            <Link to="/">
              <Button variant="primary">{t('page.notFound.home')}</Button>
            </Link>
          }
        />
      </Card>
    );
  }
  const Component = mod.component;
  // A failure inside one module must not take the rest of the app down.
  return (
    <ErrorBoundary
      fallback={(reset) => (
        <Card>
          <EmptyState
            icon={Lock}
            title={t('state.error')}
            description={t('page.module.crashed')}
            actions={<Button onClick={reset}>{t('common.retry')}</Button>}
          />
        </Card>
      )}
    >
      <Suspense fallback={<Skeleton height={240} radius={12} />}>
        <Component />
      </Suspense>
    </ErrorBoundary>
  );
}
