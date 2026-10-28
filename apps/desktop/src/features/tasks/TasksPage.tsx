import { ListChecks } from 'lucide-react';
import { PlaceholderPage } from '../../app/PlaceholderPage';
import { t } from '../../lib/i18n';

export function TasksPage() {
  return (
    <PlaceholderPage icon={ListChecks} title={t('page.tasks.title')} lead={t('page.tasks.lead')} />
  );
}
