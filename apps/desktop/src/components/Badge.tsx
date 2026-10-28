import { cx } from '../lib/cx';

export interface BadgeProps {
  count: number;
  tone?: 'neutral' | 'danger';
  max?: number;
  className?: string;
}

export function Badge({ count, tone = 'neutral', max = 99, className }: BadgeProps) {
  return (
    <span className={cx('badge', `badge--${tone}`, className)}>
      {count > max ? `${max}+` : count}
    </span>
  );
}
