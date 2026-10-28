import { useRef, type KeyboardEvent } from 'react';
import { Chip } from './Chip';

export interface TabItem {
  key: string;
  label: string;
  count?: number;
}

export interface TabsProps {
  items: TabItem[];
  value: string;
  onChange(key: string): void;
  label: string;
}

export function Tabs({ items, value, onChange, label }: TabsProps) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  const onKeyDown = (e: KeyboardEvent) => {
    const i = items.findIndex((x) => x.key === value);
    const next =
      e.key === 'ArrowRight'
        ? items[(i + 1) % items.length]
        : e.key === 'ArrowLeft'
          ? items[(i - 1 + items.length) % items.length]
          : e.key === 'Home'
            ? items[0]
            : e.key === 'End'
              ? items[items.length - 1]
              : undefined;
    if (!next) return;
    e.preventDefault();
    onChange(next.key);
    refs.current[next.key]?.focus();
  };

  return (
    <div role="tablist" aria-label={label} className="tabs" onKeyDown={onKeyDown}>
      {items.map((it) => (
        <button
          key={it.key}
          ref={(el) => {
            refs.current[it.key] = el;
          }}
          type="button"
          role="tab"
          aria-selected={it.key === value}
          tabIndex={it.key === value ? 0 : -1}
          className="tabs__tab"
          onClick={() => onChange(it.key)}
        >
          {it.label}
          {it.count !== undefined && <Chip>{it.count}</Chip>}
        </button>
      ))}
    </div>
  );
}
