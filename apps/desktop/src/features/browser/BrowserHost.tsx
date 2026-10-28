import { useEffect } from 'react';
import { bridge, listenToBrowser } from '../../lib/browserBridge';
import { useBrowser } from '../../state/browser';
import { useUi } from '../../state/ui';

/** Always mounted: receives native tab events (titles, unread counts, new-window requests) and puts idle tabs to sleep. */
export function BrowserHost() {
  useEffect(() => {
    let off: (() => void) | undefined;
    let cancelled = false;
    void listenToBrowser({
      onPage: (e) => useBrowser.getState().onPage(e),
      onTitle: (e) => useBrowser.getState().onTitle(e),
      onNewTab: ({ opener, url }) => {
        const group = useBrowser.getState().tabs.find((t) => t.id === opener)?.groupId ?? null;
        useBrowser.getState().openTab({ url, groupId: group });
      },
    }).then((unlisten) => {
      if (cancelled) unlisten();
      else off = unlisten;
    });
    const timer = setInterval(() => {
      const minutes = useUi.getState().sleepMinutes;
      if (minutes > 0) useBrowser.getState().sleepStale(Date.now(), minutes * 60_000);
    }, 60_000);
    return () => {
      cancelled = true;
      off?.();
      clearInterval(timer);
    };
  }, []);

  // Leaving the app window's browser page must never leave a native webview on top of other pages.
  useEffect(() => () => void bridge.hideAll().catch(() => {}), []);
  return null;
}
