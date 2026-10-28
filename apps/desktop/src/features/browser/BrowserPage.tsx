import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Banner } from '../../components';
import { bridge } from '../../lib/browserBridge';
import { t } from '../../lib/i18n';
import { useBreakpoint } from '../../lib/layout';
import { isTauri } from '../../lib/platform';
import { useBrowser } from '../../state/browser';
import { AddressBar } from './AddressBar';
import { BrowserViewport } from './BrowserViewport';
import { MobileBrowserBar } from './MobileBrowserBar';
import { NewTabPage } from './NewTabPage';
import { TabStrip } from './TabStrip';
import './browser.css';

export function BrowserPage() {
  const tabs = useBrowser((s) => s.tabs);
  const activeId = useBrowser((s) => s.activeId);
  const [params, setParams] = useSearchParams();
  const addressRef = useRef<HTMLInputElement>(null);
  const bp = useBreakpoint();
  const active = tabs.find((x) => x.id === activeId);

  // Opened from a sidebar network: focus its tab or open one.
  useEffect(() => {
    const app = params.get('app');
    if (!app) return;
    useBrowser.getState().openApp(app);
    setParams(
      (p) => {
        const n = new URLSearchParams(p);
        n.delete('app');
        return n;
      },
      { replace: true },
    );
  }, [params, setParams]);

  // Always at least one tab, and one of them active.
  useEffect(() => {
    const s = useBrowser.getState();
    if (s.tabs.length === 0) s.openTab();
    else if (!s.tabs.some((x) => x.id === s.activeId)) s.activate(s.tabs[0]!.id);
  }, [tabs.length, activeId]);

  // No native webview may stay on top of other pages.
  useEffect(() => () => void bridge.hideAll().catch(() => {}), []);
  useEffect(() => {
    if (active && !active.url) void bridge.hideAll().catch(() => {});
  }, [active?.id, active?.url]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
      const key = e.key.toLowerCase();
      const s = useBrowser.getState();
      if (key === 't') {
        e.preventDefault();
        s.openTab();
      } else if (key === 'w' && s.activeId) {
        e.preventDefault();
        s.closeTab(s.activeId);
      } else if (key === 'l') {
        e.preventDefault();
        addressRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const phone = bp === 'phone';
  const stage = !active ? null : active.url ? (
    <BrowserViewport tab={active} />
  ) : (
    <NewTabPage tab={active} />
  );

  return (
    <div className="browser" data-phone={phone ? 'true' : undefined}>
      <TabStrip />
      {!phone && <AddressBar tab={active} inputRef={addressRef} />}
      {!isTauri() && <Banner>{t('browser.devNotice')}</Banner>}
      <div className="browser__stage">{stage}</div>
      {phone && <MobileBrowserBar tab={active} inputRef={addressRef} />}
    </div>
  );
}
