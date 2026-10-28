import { describe, expect, it } from 'vitest';
import {
  appKeyForUrl,
  displayUrl,
  groupForUrl,
  normalizeAddress,
  parseUnread,
  tabsToSleep,
} from './browser';

describe('normalizeAddress', () => {
  it('keeps full http(s) URLs', () => {
    expect(normalizeAddress('https://lex.uz/docs/1')).toEqual({
      kind: 'url',
      url: 'https://lex.uz/docs/1',
    });
    expect(normalizeAddress('http://example.com')).toEqual({
      kind: 'url',
      url: 'http://example.com/',
    });
  });
  it('adds https:// to bare hostnames', () => {
    expect(normalizeAddress('lex.uz')).toEqual({ kind: 'url', url: 'https://lex.uz/' });
    expect(normalizeAddress('my.gov.uz/ru')).toEqual({ kind: 'url', url: 'https://my.gov.uz/ru' });
    expect(normalizeAddress('  youtube.com  ')).toEqual({
      kind: 'url',
      url: 'https://youtube.com/',
    });
  });
  it('uses http for localhost and IP addresses', () => {
    expect(normalizeAddress('localhost:8080')).toEqual({
      kind: 'url',
      url: 'http://localhost:8080/',
    });
    expect(normalizeAddress('192.168.1.1')).toEqual({ kind: 'url', url: 'http://192.168.1.1/' });
  });
  it('turns words into a Google search', () => {
    expect(normalizeAddress('ob-havo toshkent')).toEqual({
      kind: 'search',
      url: 'https://www.google.com/search?q=ob-havo%20toshkent',
    });
    expect(normalizeAddress('hisobot')).toMatchObject({ kind: 'search' });
    expect(normalizeAddress('lex uz')).toMatchObject({ kind: 'search' });
  });
  it('refuses every scheme except http and https', () => {
    for (const bad of [
      'file:///C:/Windows/win.ini',
      'javascript:alert(1)',
      'data:text/html,<b>x</b>',
      'ftp://x.uz',
      'chrome://settings',
      'tauri://localhost',
      'about:blank',
      'view-source:https://a.uz',
    ]) {
      expect(normalizeAddress(bad), bad).toEqual({ kind: 'invalid' });
    }
  });
  it('treats empty input as invalid', () => {
    expect(normalizeAddress('   ')).toEqual({ kind: 'invalid' });
  });
});

describe('url helpers', () => {
  it('recognises apps by host', () => {
    expect(appKeyForUrl('https://web.telegram.org/a/#123')).toBe('telegram');
    expect(appKeyForUrl('https://www.youtube.com/watch?v=1')).toBe('youtube');
    expect(appKeyForUrl('https://m.facebook.com/')).toBe('facebook');
    expect(appKeyForUrl('https://lex.uz/')).toBe('lex');
    expect(appKeyForUrl('https://example.com/')).toBeNull();
    expect(appKeyForUrl('notaurl')).toBeNull();
  });
  it('groups messengers and work sites', () => {
    expect(groupForUrl('https://web.whatsapp.com/')).toBe('muloqot');
    expect(groupForUrl('https://lex.uz/docs')).toBe('ish');
    expect(groupForUrl('https://example.com')).toBeNull();
  });
  it('reads unread counts and formats addresses', () => {
    expect(parseUnread('(12) Telegram')).toBe(12);
    expect(parseUnread('(99+) WhatsApp')).toBe(99);
    expect(parseUnread('Telegram')).toBe(0);
    expect(displayUrl('https://lex.uz/')).toBe('lex.uz');
    expect(displayUrl('https://lex.uz/docs/5?x=1')).toBe('lex.uz/docs/5?x=1');
  });
});

describe('tabsToSleep', () => {
  const min = 60_000;
  const now = 100 * min;
  const tabs = [
    { id: 'a', live: true, lastActive: now - 11 * min, appKey: null },
    { id: 'b', live: true, lastActive: now - 5 * min, appKey: null },
    { id: 'c', live: true, lastActive: now - 30 * min, appKey: 'telegram' },
    { id: 'd', live: false, lastActive: now - 30 * min, appKey: null },
    { id: 'e', live: true, lastActive: now - 30 * min, appKey: 'youtube' },
    { id: 'f', live: true, lastActive: now - 30 * min, appKey: null },
  ];
  it('sleeps idle live tabs after the timeout, except the active one, messengers and already-sleeping tabs', () => {
    expect(tabsToSleep(tabs, 'f', now, 10 * min)).toEqual(['a', 'e']);
  });
  it('sleeps exactly at the threshold', () => {
    expect(
      tabsToSleep(
        [{ id: 'x', live: true, lastActive: now - 10 * min, appKey: null }],
        null,
        now,
        10 * min,
      ),
    ).toEqual(['x']);
  });
});
