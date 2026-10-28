import { useEffect, useRef } from 'react';
import { wsUrl } from '../lib/config';
import { RealtimeClient } from '../lib/realtime';
import { useSession } from '../state/session';
import { useData } from '../state/data';
import { logout } from '../features/auth/auth';

const REFRESH_AFTER_MS = 60_000;

/** While signed in: load data, keep it live over WebSocket, and refresh it when the app regains focus or network. */
export function useDataSync(): void {
  const token = useSession((s) => s.token);
  const demo = useSession((s) => s.demo);
  const lastLoad = useRef(0);

  useEffect(() => {
    const load = () => {
      lastLoad.current = Date.now();
      void useData.getState().loadAll();
    };
    load();
    const onFocus = () => Date.now() - lastLoad.current > REFRESH_AFTER_MS && load();
    window.addEventListener('focus', onFocus);
    window.addEventListener('online', load);
    return () => {
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('online', load);
    };
  }, [token, demo]);

  useEffect(() => {
    if (!token || demo) return;
    const client = new RealtimeClient({
      url: () => wsUrl(token),
      onMessage: (m) => useData.getState().applyMessage(m),
      onUnauthorized: () => void logout(),
    });
    client.start();
    return () => client.stop();
  }, [token, demo]);
}
