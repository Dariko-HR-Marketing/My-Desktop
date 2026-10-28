import type { ReactNode } from 'react';
import { cx } from '../lib/cx';
import { Card } from './Card';

export interface KpiProps {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  /** 0–100 */
  progress?: number;
  tone?: 'default' | 'danger' | 'info' | 'success';
}

export function Kpi({ label, value, hint, progress, tone = 'default' }: KpiProps) {
  return (
    <Card className="kpi">
      <div className="kpi__label">{label}</div>
      <div className={cx('kpi__value', tone !== 'default' && `kpi__value--${tone}`)}>{value}</div>
      {progress !== undefined && (
        <div
          className="progress"
          role="progressbar"
          aria-label={label}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
        >
          <div
            className={cx('progress__bar', tone === 'success' && 'progress__bar--success')}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
      {hint && <div className="kpi__hint">{hint}</div>}
    </Card>
  );
}
