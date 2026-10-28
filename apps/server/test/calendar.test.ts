import { describe, expect, it, vi } from 'vitest';
import { eventsBetween, findJoinUrl } from '../src/services/calendar.js';
import {
  assertSafeUrl,
  createSafeTextFetcher,
  isPrivateAddress,
  UnsafeUrlError,
} from '../src/services/ssrf.js';
import { login, makeApp } from './helpers.js';

const ICS = (body: string) =>
  `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//test//EN\r\n${body}\r\nEND:VCALENDAR\r\n`;
const day = (d: string) =>
  [new Date(`${d}T00:00:00+05:00`), new Date(`${d}T24:00:00+05:00`)] as const; // Tashkent day

describe('eventsBetween', () => {
  it('reads a timezone-aware event and converts it to UTC', () => {
    const ics = ICS(
      `BEGIN:VEVENT\r\nUID:a1\r\nDTSTART;TZID=Asia/Tashkent:20261028T100000\r\nDTEND;TZID=Asia/Tashkent:20261028T110000\r\nSUMMARY:Boʻlim yigʻilishi\r\nLOCATION:Xona 3\r\nEND:VEVENT`,
    );
    const [from, to] = day('2026-10-28');
    const items = eventsBetween(ics, from, to);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      title: 'Boʻlim yigʻilishi',
      start: '2026-10-28T05:00:00.000Z',
      end: '2026-10-28T06:00:00.000Z',
      location: 'Xona 3',
      allDay: false,
      joinUrl: null,
    });
  });

  it('only returns events that overlap the day, sorted by start', () => {
    const ics = ICS(
      ['b', 'a', 'x']
        .map((u, i) =>
          `BEGIN:VEVENT\r\nUID:${u}\r\nDTSTART:2026-10-${i === 2 ? '30' : '28'}T0${i === 0 ? 9 : 7}0000Z\r\nDTEND:2026-10-${i === 2 ? '30' : '28'}T0${i === 0 ? 9 : 7}3000Z\r\nSUMMARY:${u}\r\nEND:VEVENT`.replace(
            '2026-10-',
            '202610',
          ),
        )
        .join('\r\n'),
    );
    const [from, to] = day('2026-10-28');
    expect(eventsBetween(ics, from, to).map((e) => e.title)).toEqual(['a', 'b']);
  });

  it('includes an event that started the evening before and runs into the day', () => {
    const ics = ICS(
      `BEGIN:VEVENT\r\nUID:n\r\nDTSTART:20261027T170000Z\r\nDTEND:20261027T210000Z\r\nSUMMARY:Tungi smena\r\nEND:VEVENT`,
    );
    const [from, to] = day('2026-10-28'); // starts 00:00 Tashkent = 19:00Z on the 27th
    expect(eventsBetween(ics, from, to).map((e) => e.title)).toEqual(['Tungi smena']);
  });

  it('expands recurring events, honouring EXDATE and overridden instances', () => {
    const ics = ICS(
      [
        'BEGIN:VEVENT',
        'UID:r1',
        'DTSTART:20261026T090000Z',
        'DTEND:20261026T093000Z',
        'RRULE:FREQ=DAILY;COUNT=10',
        'EXDATE:20261029T090000Z',
        'SUMMARY:Planyorka',
        'END:VEVENT',
        'BEGIN:VEVENT',
        'UID:r1',
        'RECURRENCE-ID:20261028T090000Z',
        'DTSTART:20261028T120000Z',
        'DTEND:20261028T123000Z',
        'SUMMARY:Planyorka (koʻchirildi)',
        'END:VEVENT',
      ].join('\r\n'),
    );
    const titles = (d: string) =>
      eventsBetween(ics, ...day(d)).map((e) => `${e.title}@${e.start.substring(11, 16)}`);
    expect(titles('2026-10-27')).toEqual(['Planyorka@09:00']);
    expect(titles('2026-10-28')).toEqual(['Planyorka (koʻchirildi)@12:00']);
    expect(titles('2026-10-29')).toEqual([]); // excluded date
    expect(titles('2026-10-30')).toEqual(['Planyorka@09:00']);
    expect(titles('2026-11-10')).toEqual([]); // after COUNT
  });

  it('marks all-day events and skips cancelled ones', () => {
    const ics = ICS(
      [
        'BEGIN:VEVENT',
        'UID:h',
        'DTSTART;VALUE=DATE:20261028',
        'DTEND;VALUE=DATE:20261029',
        'SUMMARY:Bayram',
        'END:VEVENT',
        'BEGIN:VEVENT',
        'UID:c',
        'DTSTART:20261028T060000Z',
        'DTEND:20261028T070000Z',
        'STATUS:CANCELLED',
        'SUMMARY:Bekor',
        'END:VEVENT',
      ].join('\r\n'),
    );
    const items = eventsBetween(ics, ...day('2026-10-28'));
    expect(items.map((e) => [e.title, e.allDay])).toEqual([['Bayram', true]]);
  });

  it('finds an online-meeting link in the description', () => {
    const ics = ICS(
      `BEGIN:VEVENT\r\nUID:m\r\nDTSTART:20261028T090000Z\r\nDTEND:20261028T100000Z\r\nSUMMARY:Onlayn\r\nDESCRIPTION:Qoʻshilish: https://meet.google.com/abc-defg-hij.\\nRahmat\r\nEND:VEVENT`,
    );
    expect(eventsBetween(ics, ...day('2026-10-28'))[0]!.joinUrl).toBe(
      'https://meet.google.com/abc-defg-hij',
    );
  });

  it('gives untitled events a placeholder and tolerates garbage', () => {
    const ics = ICS(
      `BEGIN:VEVENT\r\nUID:z\r\nDTSTART:20261028T090000Z\r\nDTEND:20261028T100000Z\r\nEND:VEVENT`,
    );
    expect(eventsBetween(ics, ...day('2026-10-28'))[0]!.title).toBe('(Nomsiz)');
    expect(eventsBetween('not a calendar at all', ...day('2026-10-28'))).toEqual([]);
  });
});

describe('findJoinUrl', () => {
  it('recognises the common providers and ignores other links', () => {
    expect(findJoinUrl('https://us02web.zoom.us/j/123?pwd=x')).toContain('zoom.us/j/123');
    expect(findJoinUrl('', 'https://teams.microsoft.com/l/meetup-join/abc')).toContain(
      'teams.microsoft.com',
    );
    expect(findJoinUrl('https://example.com/meet')).toBeNull();
    expect(findJoinUrl(undefined, null)).toBeNull();
  });
});

describe('SSRF protection', () => {
  it('accepts only public https URLs without credentials', () => {
    expect(
      assertSafeUrl('https://calendar.google.com/calendar/ical/x/private-y/basic.ics').hostname,
    ).toBe('calendar.google.com');
    for (const bad of [
      'http://calendar.google.com/x.ics',
      'ftp://x.uz/a',
      'file:///etc/passwd',
      'https://user:pw@x.uz/a',
      'https://localhost/a',
      'https://127.0.0.1/a',
      'https://[::1]/a',
      'https://10.0.0.5/a',
      'https://169.254.169.254/latest',
      'https://intranet.local/a',
      'https://db.internal/a',
      'javascript:alert(1)',
      'nonsense',
    ]) {
      expect(() => assertSafeUrl(bad), bad).toThrow(UnsafeUrlError);
    }
  });

  it('classifies private and public addresses', () => {
    for (const a of [
      '0.0.0.0',
      '10.1.2.3',
      '127.0.0.1',
      '169.254.169.254',
      '172.16.0.1',
      '172.31.255.255',
      '192.168.1.1',
      '100.64.0.1',
      '224.0.0.1',
      '::1',
      '::',
      'fe80::1',
      'fd00::1',
      '::ffff:10.0.0.1',
      'not-an-ip',
    ]) {
      expect(isPrivateAddress(a), a).toBe(true);
    }
    for (const a of ['8.8.8.8', '95.130.227.92', '172.32.0.1', '2606:4700:4700::1111']) {
      expect(isPrivateAddress(a), a).toBe(false);
    }
  });

  it('re-validates every redirect hop and limits redirects and size', async () => {
    const redirect = (to: string) => new Response(null, { status: 302, headers: { location: to } });
    const toPrivate = createSafeTextFetcher({
      fetchImpl: (async () => redirect('https://127.0.0.1/x')) as never,
    });
    await expect(toPrivate('https://ok.example.com/a.ics')).rejects.toThrow(UnsafeUrlError);
    const toHttp = createSafeTextFetcher({
      fetchImpl: (async () => redirect('http://ok.example.com/a')) as never,
    });
    await expect(toHttp('https://ok.example.com/a.ics')).rejects.toThrow(UnsafeUrlError);
    const loop = createSafeTextFetcher({
      fetchImpl: (async () => redirect('https://ok.example.com/b')) as never,
    });
    await expect(loop('https://ok.example.com/a.ics')).rejects.toThrow('too many redirects');
    const big = createSafeTextFetcher({
      fetchImpl: (async () =>
        new Response('x', { headers: { 'content-length': String(5 * 1024 * 1024) } })) as never,
    });
    await expect(big('https://ok.example.com/a.ics')).rejects.toThrow('too large');
    const ok = createSafeTextFetcher({
      fetchImpl: (async () => new Response('BEGIN:VCALENDAR')) as never,
    });
    await expect(ok('https://ok.example.com/a.ics')).resolves.toBe('BEGIN:VCALENDAR');
  });
});

describe('calendar API', () => {
  const now = new Date('2026-10-28T07:00:00Z'); // noon in Tashkent
  const ics = ICS(
    `BEGIN:VEVENT\r\nUID:e\r\nDTSTART:20261028T090000Z\r\nDTEND:20261028T100000Z\r\nSUMMARY:Uchrashuv\r\nDESCRIPTION:https://zoom.us/j/99\r\nEND:VEVENT`,
  );
  const URL_ = 'https://calendar.example.com/private-abc/basic.ics';

  it('is "not configured" until the user saves an address', async () => {
    const app = await makeApp({ now: () => now });
    const { headers } = await login(app);
    expect((await app.inject({ url: '/api/calendar/today', headers })).json()).toEqual({
      configured: false,
      items: [],
      fetchedAt: null,
      stale: false,
    });
  });

  it("returns today's events from the saved address and caches the download", async () => {
    const fetchText = vi.fn(async () => ics);
    const app = await makeApp({ now: () => now, calendarFetch: fetchText });
    const { headers } = await login(app);
    expect(
      (
        await app.inject({
          method: 'PATCH',
          url: '/api/settings',
          headers,
          payload: { calendarUrl: URL_ },
        })
      ).statusCode,
    ).toBe(200);
    const res = await app.inject({ url: '/api/calendar/today', headers });
    expect(res.json()).toMatchObject({
      configured: true,
      stale: false,
      items: [{ title: 'Uchrashuv', joinUrl: 'https://zoom.us/j/99' }],
    });
    await app.inject({ url: '/api/calendar/today', headers });
    expect(fetchText).toHaveBeenCalledTimes(1);
  });

  it('refuses unsafe addresses when saving settings', async () => {
    const app = await makeApp();
    const { headers } = await login(app);
    for (const bad of [
      'http://calendar.example.com/a.ics',
      'https://127.0.0.1/a.ics',
      'https://10.0.0.1/a',
      'https://localhost/a',
      'not a url',
    ]) {
      const res = await app.inject({
        method: 'PATCH',
        url: '/api/settings',
        headers,
        payload: { calendarUrl: bad },
      });
      expect(res.statusCode, bad).toBe(400);
    }
    expect(
      (
        await app.inject({
          method: 'PATCH',
          url: '/api/settings',
          headers,
          payload: { calendarUrl: '' },
        })
      ).statusCode,
    ).toBe(200);
  });

  it('serves the last copy as stale when the source fails, and 503 when there is none', async () => {
    let t = now;
    let fail = false;
    const app = await makeApp({
      now: () => t,
      calendarFetch: async () => {
        if (fail) throw new Error('down');
        return ics;
      },
    });
    const { headers } = await login(app);
    await app.inject({
      method: 'PATCH',
      url: '/api/settings',
      headers,
      payload: { calendarUrl: URL_ },
    });
    fail = true;
    expect((await app.inject({ url: '/api/calendar/today', headers })).statusCode).toBe(503);
    fail = false;
    await app.inject({ url: '/api/calendar/today', headers });
    fail = true;
    t = new Date(t.getTime() + 6 * 60_000);
    const stale = await app.inject({ url: '/api/calendar/today', headers });
    expect(stale.statusCode).toBe(200);
    expect(stale.json().stale).toBe(true);
  });

  it("keeps each user's calendar separate", async () => {
    const other = ICS(
      `BEGIN:VEVENT\r\nUID:o\r\nDTSTART:20261028T090000Z\r\nDTEND:20261028T100000Z\r\nSUMMARY:Boshqa\r\nEND:VEVENT`,
    );
    const app = await makeApp({
      now: () => now,
      calendarFetch: async (u) => (u.includes('rahbar') ? other : ics),
    });
    const emp = await login(app, 'xodim');
    const mgr = await login(app, 'rahbar');
    await app.inject({
      method: 'PATCH',
      url: '/api/settings',
      headers: emp.headers,
      payload: { calendarUrl: URL_ },
    });
    await app.inject({
      method: 'PATCH',
      url: '/api/settings',
      headers: mgr.headers,
      payload: { calendarUrl: 'https://calendar.example.com/rahbar/basic.ics' },
    });
    expect(
      (await app.inject({ url: '/api/calendar/today', headers: emp.headers })).json().items[0]
        .title,
    ).toBe('Uchrashuv');
    expect(
      (await app.inject({ url: '/api/calendar/today', headers: mgr.headers })).json().items[0]
        .title,
    ).toBe('Boshqa');
  });
});
