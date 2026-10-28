import { describe, expect, it, vi } from 'vitest';
import { describeWeather } from '../src/services/widgets.js';
import { jsonResponse, login, makeApp } from './helpers.js';

const cbu = [
  { Ccy: 'USD', CcyNm_UZ: 'AQSH dollari', Rate: '12650.50', Diff: '-12.3', Date: '28.10.2026' },
  { Ccy: 'EUR', CcyNm_UZ: 'EVRO', Rate: '14700.00', Diff: '5.1', Date: '28.10.2026' },
  { Ccy: 'RUB', CcyNm_UZ: 'Rossiya rubli', Rate: '135.20', Diff: '0.4', Date: '28.10.2026' },
  { Ccy: 'KZT', CcyNm_UZ: 'Qozogʻiston tengesi', Rate: '24.10', Diff: '0.1', Date: '28.10.2026' },
  { Ccy: 'CNY', CcyNm_UZ: 'Xitoy yuani', Rate: '1750.00', Diff: '1.0', Date: '28.10.2026' },
  { Ccy: 'GBP', CcyNm_UZ: 'Funt', Rate: '16000.00', Diff: '1.0', Date: '28.10.2026' },
];
const weather = {
  current: { temperature_2m: 14.6, weather_code: 3 },
  daily: { temperature_2m_max: [16, 18.4] },
};

describe('currency widget', () => {
  it('returns the five tracked currencies and caches for 30 minutes', async () => {
    let t = new Date('2026-10-28T07:00:00Z');
    const fetch = vi.fn(() => jsonResponse(cbu));
    const app = await makeApp({ fetch, now: () => t });
    const { headers } = await login(app);

    const res = await app.inject({ url: '/api/widgets/currency', headers });
    const body = res.json();
    expect(body.items.map((i: { code: string }) => i.code)).toEqual([
      'USD',
      'EUR',
      'RUB',
      'KZT',
      'CNY',
    ]);
    expect(body.items[0]).toMatchObject({ rate: 12650.5, diff: -12.3 });
    expect(body).toMatchObject({ stale: false, source: 'Markaziy bank' });

    await app.inject({ url: '/api/widgets/currency', headers });
    expect(fetch).toHaveBeenCalledTimes(1);
    t = new Date(t.getTime() + 31 * 60_000);
    await app.inject({ url: '/api/widgets/currency', headers });
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('serves the last value with stale=true when the source fails', async () => {
    let t = new Date('2026-10-28T07:00:00Z');
    let fail = false;
    const fetch = vi.fn(() => (fail ? Promise.reject(new Error('down')) : jsonResponse(cbu)));
    const app = await makeApp({ fetch, now: () => t });
    const { headers } = await login(app);
    const fresh = (await app.inject({ url: '/api/widgets/currency', headers })).json();

    fail = true;
    t = new Date(t.getTime() + 31 * 60_000);
    const res = await app.inject({ url: '/api/widgets/currency', headers });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ stale: true, fetchedAt: fresh.fetchedAt });
  });

  it('responds 503 when the source fails and nothing is cached', async () => {
    const app = await makeApp({ fetch: () => jsonResponse({}, 500) });
    const { headers } = await login(app);
    const res = await app.inject({ url: '/api/widgets/currency', headers });
    expect(res.statusCode).toBe(503);
    expect(res.json().error).toBe('unavailable');
  });
});

describe('weather widget', () => {
  it('maps open-meteo data', async () => {
    const app = await makeApp({ fetch: () => jsonResponse(weather) });
    const { headers } = await login(app);
    expect((await app.inject({ url: '/api/widgets/weather', headers })).json()).toMatchObject({
      city: 'Toshkent',
      temperature: 15,
      weatherCode: 3,
      description: 'Bulutli',
      tomorrowMax: 18,
      stale: false,
    });
  });

  it('requires authentication', async () => {
    const app = await makeApp({ fetch: () => jsonResponse(weather) });
    expect((await app.inject({ url: '/api/widgets/weather' })).statusCode).toBe(401);
  });

  it('describes WMO codes in Uzbek', () => {
    expect(describeWeather(0)).toBe('Ochiq');
    expect(describeWeather(63)).toBe('Yomgʻir');
    expect(describeWeather(95)).toBe('Momaqaldiroq');
  });
});
