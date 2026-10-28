import type { CSSProperties } from 'react';
import { cx } from '../lib/cx';

export interface SkeletonProps {
  width?: CSSProperties['width'];
  height?: CSSProperties['height'];
  radius?: CSSProperties['borderRadius'];
  className?: string;
}

/** Decorative placeholder. The surrounding block sets aria-busy="true". */
export function Skeleton({ width = '100%', height = 14, radius, className }: SkeletonProps) {
  return (
    <span
      aria-hidden="true"
      className={cx('skeleton', className)}
      style={{ width, height, borderRadius: radius }}
    />
  );
}
