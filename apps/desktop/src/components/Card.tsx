import type { ReactNode } from 'react';
import { cx } from '../lib/cx';

export interface CardProps {
  title?: ReactNode;
  /** Right-aligned header content, e.g. an "All →" link. */
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  'aria-busy'?: boolean;
}

export function Card({ title, action, children, className, ...rest }: CardProps) {
  return (
    <section className={cx('card', className)} {...rest}>
      {(title || action) && (
        <header className="card__head">
          {title && <h2 className="card__title">{title}</h2>}
          {action}
        </header>
      )}
      {children}
    </section>
  );
}
