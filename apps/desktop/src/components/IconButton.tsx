import type { ButtonHTMLAttributes } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cx } from '../lib/cx';
import { Badge } from './Badge';

export interface IconButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'aria-label'
> {
  /** Required accessible name. */
  label: string;
  icon: LucideIcon;
  /** Count shown in the top-right corner; hidden when 0 or undefined. */
  badge?: number;
}

export function IconButton({
  label,
  icon: Icon,
  badge,
  className,
  type = 'button',
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={badge ? `${label}: ${badge}` : label}
      className={cx('icon-btn', className)}
      {...rest}
    >
      <Icon size={20} strokeWidth={1.8} aria-hidden="true" />
      {badge ? <Badge tone="danger" count={badge} className="icon-btn__badge" /> : null}
    </button>
  );
}
