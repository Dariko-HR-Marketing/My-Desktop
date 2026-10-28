import type { ReactNode } from 'react';
import { AlertTriangle, WifiOff } from 'lucide-react';
import { cx } from '../lib/cx';

export interface BannerProps {
  tone?: 'warning' | 'danger';
  /** Offline uses a different icon but the same warning colours. */
  offline?: boolean;
  children: ReactNode;
  action?: ReactNode;
}

export function Banner({ tone = 'warning', offline, children, action }: BannerProps) {
  const Icon = offline ? WifiOff : AlertTriangle;
  return (
    <div className={cx('banner', `banner--${tone}`)} role={tone === 'danger' ? 'alert' : 'status'}>
      <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
      <span className="banner__text">{children}</span>
      {action}
    </div>
  );
}
