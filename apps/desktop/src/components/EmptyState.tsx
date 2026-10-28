import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cx } from '../lib/cx';

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  tone?: 'neutral' | 'success';
  actions?: ReactNode;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  tone = 'neutral',
  actions,
}: EmptyStateProps) {
  return (
    <div className="empty">
      <div className={cx('empty__icon', tone === 'success' && 'empty__icon--success')}>
        <Icon size={28} strokeWidth={1.8} aria-hidden="true" />
      </div>
      <h2 className="empty__title">{title}</h2>
      {description && <p className="empty__text">{description}</p>}
      {actions && <div className="empty__actions">{actions}</div>}
    </div>
  );
}
