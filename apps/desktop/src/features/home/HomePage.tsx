import { Home } from 'lucide-react';
import { PlaceholderPage } from '../../app/PlaceholderPage';
import { t } from '../../lib/i18n';

export function HomePage() {
  return <PlaceholderPage icon={Home} title={t('page.home.title')} lead={t('page.home.lead')} />;
}
