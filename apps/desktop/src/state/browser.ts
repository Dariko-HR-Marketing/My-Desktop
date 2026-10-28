import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { appKeyForUrl, groupForUrl, tabsToSleep } from '../lib/browser';
import { bridge } from '../lib/browserBridge';
import { appByKey } from '../features/browser/networks';

export type GroupId = 'muloqot' | 'ish';
export const GROUPS: Record<GroupId, { name: string; color: string }> = {
  muloqot: { name: 'Muloqot', color: 'var(--tabgroup-muloqot)' },
  ish: { name: 'Ish', color: 'var(--tabgroup-ish)' },
};

export interface Tab {
  id: string;
  /** Empty string = the new-tab (start) page. */
  url: string;
  title: string;
  groupId: GroupId | null;
  appKey: string | null;
  lastActive: number;
  // transient: not persisted
  loading: boolean;
  unread: number;
  /** A native webview currently exists for this tab. */
  live: boolean;
  sleeping: boolean;
}

export interface RecentItem {
  title: string;
  url: string;
  at: number;
}

interface BrowserState {
  tabs: Tab[];
  activeId: string | null;
  recent: RecentItem[];
  openTab(opts?: { url?: string; groupId?: GroupId | null; activate?: boolean }): string;
  openApp(key: string): void;
  closeTab(id: string): void;
  activate(id: string): void;
  navigate(id: string, url: string): void;
  setLive(id: string, live: boolean): void;
  setGroup(id: string, groupId: GroupId | null): void;
  onPage(e: { id: string; url: string; loading: boolean }): void;
  onTitle(e: { id: string; title: string; unread: number }): void;
  sleepStale(now: number, sleepMs: number): void;
}

const newId = () => `t${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const MAX_RECENT = 4;

const makeTab = (url: string, groupId: GroupId | null, now = Date.now()): Tab => ({
  id: newId(),
  url,
  title: '',
  groupId: groupId ?? (url ? groupForUrl(url) : null),
  appKey: url ? appKeyForUrl(url) : null,
  lastActive: now,
  loading: false,
  unread: 0,
  live: false,
  sleeping: false,
});

const storage = createJSONStorage(() => {
  try {
    localStorage.getItem('probe');
    return localStorage;
  } catch {
    return { getItem: () => null, setItem: () => {}, removeItem: () => {} };
  }
});

export const useBrowser = create<BrowserState>()(
  persist(
    (set, get) => ({
      tabs: [],
      activeId: null,
      recent: [],

      openTab(opts = {}) {
        const tab = makeTab(opts.url ?? '', opts.groupId ?? null);
        set((s) => ({
          tabs: [...s.tabs, tab],
          activeId: opts.activate === false ? s.activeId : tab.id,
        }));
        return tab.id;
      },

      openApp(key) {
        const existing = get().tabs.find((t) => t.appKey === key);
        if (existing) return get().activate(existing.id);
        const app = appByKey(key);
        if (app) get().openTab({ url: app.url });
      },

      closeTab(id) {
        void bridge.close(id).catch(() => {});
        set((s) => {
          const index = s.tabs.findIndex((t) => t.id === id);
          if (index < 0) return s;
          const tabs = s.tabs.filter((t) => t.id !== id);
          let activeId = s.activeId;
          if (activeId === id) activeId = (tabs[index] ?? tabs[index - 1] ?? null)?.id ?? null;
          return { tabs, activeId };
        });
      },

      activate: (id) =>
        set((s) => ({
          activeId: id,
          tabs: s.tabs.map((t) =>
            t.id === id ? { ...t, lastActive: Date.now(), sleeping: false } : t,
          ),
        })),

      navigate(id, url) {
        set((s) => ({
          tabs: s.tabs.map((t) =>
            t.id === id
              ? {
                  ...t,
                  url,
                  loading: true,
                  appKey: appKeyForUrl(url),
                  groupId: t.groupId ?? groupForUrl(url),
                }
              : t,
          ),
        }));
        // if the webview is not open yet, it is created with the new url when the tab is shown
        void bridge.navigate(id, url).catch(() => {});
      },

      setLive: (id, live) =>
        set((s) => ({ tabs: s.tabs.map((t) => (t.id === id ? { ...t, live } : t)) })),
      setGroup: (id, groupId) =>
        set((s) => ({ tabs: s.tabs.map((t) => (t.id === id ? { ...t, groupId } : t)) })),

      onPage({ id, url, loading }) {
        set((s) => ({
          tabs: s.tabs.map((t) =>
            t.id === id
              ? { ...t, url, loading, appKey: appKeyForUrl(url) ?? t.appKey, live: true }
              : t,
          ),
        }));
      },

      onTitle({ id, title, unread }) {
        set((s) => {
          const tab = s.tabs.find((t) => t.id === id);
          const recent =
            tab && tab.url && title
              ? [
                  { title, url: tab.url, at: Date.now() },
                  ...s.recent.filter((r) => r.url !== tab.url),
                ].slice(0, MAX_RECENT)
              : s.recent;
          return { recent, tabs: s.tabs.map((t) => (t.id === id ? { ...t, title, unread } : t)) };
        });
      },

      sleepStale(now, sleepMs) {
        const { tabs, activeId } = get();
        const ids = new Set(tabsToSleep(tabs, activeId, now, sleepMs));
        if (ids.size === 0) return;
        ids.forEach((id) => void bridge.close(id).catch(() => {}));
        set((s) => ({
          tabs: s.tabs.map((t) =>
            ids.has(t.id) ? { ...t, live: false, sleeping: true, loading: false } : t,
          ),
        }));
      },
    }),
    {
      name: 'ish-browser',
      storage,
      // Tabs are restored without live webviews: they are re-created when shown.
      partialize: (s) => ({
        activeId: s.activeId,
        recent: s.recent,
        tabs: s.tabs.map((t) => ({
          ...t,
          loading: false,
          unread: 0,
          live: false,
          sleeping: false,
        })),
      }),
    },
  ),
);

export const selectUnreadByApp = (tabs: Tab[]): Record<string, number> =>
  tabs.reduce<Record<string, number>>((acc, t) => {
    if (t.appKey && t.unread > 0) acc[t.appKey] = (acc[t.appKey] ?? 0) + t.unread;
    return acc;
  }, {});
