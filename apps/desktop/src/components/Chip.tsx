import type { ReactNode } from 'react';
import { cx } from '../lib/cx';

export interface ChipProps {
  tone?: 'danger' | 'warning' | 'success' | 'info' | 'neutral';
  children: ReactNode;
  className?: string;
}

/** Status chip. Always carries text: colour alone never conveys the state. */
export function Chip({ tone = 'neutral', children, className }: ChipProps) {
  return <span className={cx('chip', `chip--${tone}`, className)}>{children}</span>;
}
