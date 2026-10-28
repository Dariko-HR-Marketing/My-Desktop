import { useEffect } from 'react';
import { useToast } from '../state/toast';

function ToastItem({ id, text }: { id: number; text: string }) {
  const dismiss = useToast((s) => s.dismiss);
  useEffect(() => {
    const timer = setTimeout(() => dismiss(id), 5000);
    return () => clearTimeout(timer);
  }, [id, dismiss]);
  return <div className="toast">{text}</div>;
}

/** Polite live region for short messages ("change was not saved"). */
export function ToastHost() {
  const items = useToast((s) => s.items);
  return (
    <div className="toast-host" role="status" aria-live="polite">
      {items.map((i) => (
        <ToastItem key={i.id} {...i} />
      ))}
    </div>
  );
}
