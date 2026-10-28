import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import { isTauri } from './platform';

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PageEvent {
  id: string;
  url: string;
  loading: boolean;
}
export interface TitleEvent {
  id: string;
  title: string;
  unread: number;
}
export interface NewTabEvent {
  opener: string;
  url: string;
}

const call = (cmd: string, args: Record<string, unknown>) =>
  isTauri() ? invoke<void>(cmd, args) : Promise.resolve();

/** Thin wrapper over the Rust `browser_*` commands. Outside the desktop app every call is a no-op (the page uses an iframe). */
export const bridge = {
  show: (id: string, url: string, bounds: Bounds) => call('browser_show', { id, url, bounds }),
  hide: (id: string) => call('browser_hide', { id }),
  hideAll: () => call('browser_hide_all', {}),
  navigate: (id: string, url: string) => call('browser_navigate', { id, url }),
  history: (id: string, action: 'back' | 'forward' | 'reload') =>
    call('browser_history', { id, action }),
  close: (id: string) => call('browser_close', { id }),
};

export interface BridgeHandlers {
  onPage(e: PageEvent): void;
  onTitle(e: TitleEvent): void;
  onNewTab(e: NewTabEvent): void;
}

export async function listenToBrowser(h: BridgeHandlers): Promise<UnlistenFn> {
  if (!isTauri()) return () => {};
  const offs = await Promise.all([
    listen<PageEvent>('browser://page', (e) => h.onPage(e.payload)),
    listen<TitleEvent>('browser://title', (e) => h.onTitle(e.payload)),
    listen<NewTabEvent>('browser://new-tab', (e) => h.onNewTab(e.payload)),
  ]);
  return () => offs.forEach((off) => off());
}
