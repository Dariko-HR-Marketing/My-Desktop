import { beforeEach, describe, expect, it } from 'vitest';
import { selectUnreadByApp, useBrowser } from './browser';

const reset = () => useBrowser.setState({ tabs: [], activeId: null, recent: [] });
const st = () => useBrowser.getState();

describe('browser store', () => {
  beforeEach(reset);

  it('opens an app once and re-activates it afterwards', () => {
    st().openApp('telegram');
    const first = st().activeId;
    expect(st().tabs).toHaveLength(1);
    expect(st().tabs[0]).toMatchObject({
      appKey: 'telegram',
      groupId: 'muloqot',
      url: 'https://web.telegram.org/a/',
    });
    st().openTab({});
    st().openApp('telegram');
    expect(st().tabs).toHaveLength(2);
    expect(st().activeId).toBe(first);
  });

  it('closing the active tab activates its neighbour, then nothing when empty', () => {
    const a = st().openTab({ url: 'https://lex.uz/' });
    const b = st().openTab({ url: 'https://my.gov.uz/' });
    const c = st().openTab({ url: 'https://soliq.uz/' });
    st().activate(b);
    st().closeTab(b);
    expect(st().activeId).toBe(c);
    st().closeTab(c);
    expect(st().activeId).toBe(a);
    st().closeTab(a);
    expect(st().activeId).toBeNull();
    expect(st().tabs).toEqual([]);
  });

  it('tracks page and title events, including unread counts and recents', () => {
    const tab = st().openTab({ url: 'https://web.telegram.org/a/' });
    st().onPage({ id: tab, url: 'https://web.telegram.org/a/#1', loading: false });
    st().onTitle({ id: tab, title: '(12) Telegram', unread: 12 });
    expect(selectUnreadByApp(st().tabs)).toEqual({ telegram: 12 });
    expect(st().recent[0]).toMatchObject({
      title: '(12) Telegram',
      url: 'https://web.telegram.org/a/#1',
    });
    st().onTitle({ id: tab, title: 'Telegram', unread: 0 });
    expect(selectUnreadByApp(st().tabs)).toEqual({});
  });

  it('keeps at most four distinct recents', () => {
    const tab = st().openTab({ url: 'https://a.uz/' });
    for (const n of [1, 2, 3, 4, 5, 3]) {
      st().onPage({ id: tab, url: `https://a${n}.uz/`, loading: false });
      st().onTitle({ id: tab, title: `Sayt ${n}`, unread: 0 });
    }
    expect(st().recent.map((r) => r.title)).toEqual(['Sayt 3', 'Sayt 5', 'Sayt 4', 'Sayt 2']);
  });

  it('sleeps idle live tabs but not the active one or messengers', () => {
    const idle = st().openTab({ url: 'https://lex.uz/' });
    const tg = st().openTab({ url: 'https://web.telegram.org/a/' });
    const active = st().openTab({ url: 'https://my.gov.uz/' });
    for (const id of [idle, tg, active]) st().setLive(id, true);
    useBrowser.setState((s) => ({ tabs: s.tabs.map((t) => ({ ...t, lastActive: 0 })) }));
    st().sleepStale(11 * 60_000, 10 * 60_000);
    const byId = Object.fromEntries(st().tabs.map((t) => [t.id, t]));
    expect(byId[idle]).toMatchObject({ live: false, sleeping: true });
    expect(byId[tg]).toMatchObject({ live: true, sleeping: false });
    expect(byId[active]).toMatchObject({ live: true, sleeping: false });
    st().activate(idle);
    expect(st().tabs.find((t) => t.id === idle)?.sleeping).toBe(false);
  });

  it('navigating updates url, app and group', () => {
    const tab = st().openTab({});
    st().navigate(tab, 'https://lex.uz/docs/1');
    expect(st().tabs[0]).toMatchObject({
      url: 'https://lex.uz/docs/1',
      loading: true,
      groupId: 'ish',
      appKey: null,
    });
  });
});
