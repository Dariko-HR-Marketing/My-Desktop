import { Link, useParams } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { Button, Card, EmptyState } from '../../components';
import { PlaceholderPage } from '../../app/PlaceholderPage';
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
  return <PlaceholderPage icon={mod.icon} title={t(mod.name)} lead={t('page.module.lead')} />;
}
