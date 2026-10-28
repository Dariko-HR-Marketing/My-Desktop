import { LogIn } from 'lucide-react';
import { PlaceholderPage } from '../../app/PlaceholderPage';
import { t } from '../../lib/i18n';

export function LoginPage() {
  return (
    <main className="page" id="content">
      <PlaceholderPage icon={LogIn} title={t('page.login.title')} lead={t('page.login.lead')} />
    </main>
  );
}
