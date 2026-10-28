import { Link } from 'react-router-dom';
import { SearchX } from 'lucide-react';
import { Button, Card, EmptyState } from '../components';
import { t } from '../lib/i18n';

export function NotFoundPage() {
  return (
    <Card>
      <EmptyState
        icon={SearchX}
        title={t('page.notFound.title')}
        description={t('page.notFound.lead')}
        actions={
          <Link to="/">
            <Button variant="primary">{t('page.notFound.home')}</Button>
          </Link>
        }
      />
    </Card>
  );
}
