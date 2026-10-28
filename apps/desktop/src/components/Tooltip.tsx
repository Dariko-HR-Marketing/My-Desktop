import { cloneElement, useId, useState, type ReactElement } from 'react';

export interface TooltipProps {
  content: string;
  side?: 'right' | 'bottom';
  children: ReactElement<{ 'aria-describedby'?: string }>;
}

/** Shows on hover and keyboard focus; Esc dismisses. */
export function Tooltip({ content, side = 'right', children }: TooltipProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  return (
    <span
      className="tooltip-host"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
    >
      {cloneElement(children, open ? { 'aria-describedby': id } : {})}
      {open && (
        <span id={id} role="tooltip" className={`tooltip tooltip--${side}`}>
          {content}
        </span>
      )}
    </span>
  );
}
