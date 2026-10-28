import { Globe } from 'lucide-react';
import { PlaceholderPage } from '../../app/PlaceholderPage';
import { t } from '../../lib/i18n';

export function BrowserPage() {
  return (
    <PlaceholderPage icon={Globe} title={t('page.browser.title')} lead={t('page.browser.lead')} />
  );
}
