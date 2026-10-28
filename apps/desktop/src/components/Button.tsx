import type { ButtonHTMLAttributes, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cx } from '../lib/cx';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger-ghost';
  icon?: LucideIcon;
  children: ReactNode;
}

export function Button({
  variant = 'secondary',
  icon: Icon,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button type={type} className={cx('btn', `btn--${variant}`, className)} {...rest}>
      {Icon && <Icon size={18} strokeWidth={1.8} aria-hidden="true" />}
      {children}
    </button>
  );
}
