import { useEffect, useRef } from 'react';
import { bridge } from '../../lib/browserBridge';
import { isTauri } from '../../lib/platform';
import { useOverlay } from '../../state/overlay';
import { useBrowser, type Tab } from '../../state/browser';

/**
 * The area a tab's native webview is drawn over. Its on-screen rectangle is sent to Rust whenever it changes.
 * Outside the desktop app (vite dev) an iframe stands in; many sites refuse to be framed, hence the notice on the page.
 */
export function BrowserViewport({ tab }: { tab: Tab }) {
  const ref = useRef<HTMLDivElement>(null);
  const overlays = useOverlay((s) => s.count);
  const desktop = isTauri();

  useEffect(() => {
    if (!desktop) return;
    if (overlays > 0) {
      void bridge.hideAll().catch(() => {});
      return;
    }
    const el = ref.current;
    if (!el) return;
    let frame = 0;
    const push = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        const current = useBrowser.getState().tabs.find((t) => t.id === tab.id);
        if (!current?.url) return;
        bridge
          .show(tab.id, current.url, { x: r.x, y: r.y, width: r.width, height: r.height })
          .then(() => useBrowser.getState().setLive(tab.id, true))
          .catch((err) => console.error('browser_show failed', err));
      });
    };
    push();
    const observer = new ResizeObserver(push);
    observer.observe(el);
    window.addEventListener('resize', push);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', push);
      cancelAnimationFrame(frame);
    };
  }, [tab.id, overlays, desktop]);

  return (
    <div ref={ref} className="viewport">
      {!desktop && (
        <iframe
          key={tab.id}
          className="viewport__frame"
          src={tab.url}
          title={tab.title || tab.url}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          referrerPolicy="no-referrer"
        />
      )}
    </div>
  );
}
