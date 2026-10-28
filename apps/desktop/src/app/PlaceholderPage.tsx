import type { LucideIcon } from 'lucide-react';
import { Card, EmptyState } from '../components';

export function PlaceholderPage({
  icon,
  title,
  lead,
}: {
  icon: LucideIcon;
  title: string;
  lead: string;
}) {
  return (
    <>
      <div className="page__head">
        <h1 className="t-display">{title}</h1>
      </div>
      <Card>
        <EmptyState icon={icon} title={title} description={lead} />
      </Card>
    </>
  );
}
