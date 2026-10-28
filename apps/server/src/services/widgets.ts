import type { CurrencyRate, CurrencyWidget, WeatherWidget } from '@ish-maydoni/shared';
import { TtlCache } from './cache.js';

export type FetchLike = (
  url: string,
  init?: { signal?: AbortSignal },
) => Promise<{
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
}>;

const CURRENCIES = ['USD', 'EUR', 'RUB', 'KZT', 'CNY'];
const CBU_URL = 'https://cbu.uz/uz/arkhiv-kursov-valyut/json/';
// Toshkent
const WEATHER_URL =
  'https://api.open-meteo.com/v1/forecast?latitude=41.2995&longitude=69.2401' +
  '&current=temperature_2m,weather_code&daily=temperature_2m_max&forecast_days=2&timezone=auto';

export class WidgetUnavailableError extends Error {}

/** WMO weather interpretation codes → Uzbek description. */
export function describeWeather(code: number): string {
  if (code === 0) return 'Ochiq';
  if (code <= 2) return 'Qisman bulutli';
  if (code === 3) return 'Bulutli';
  if (code === 45 || code === 48) return 'Tuman';
  if (code >= 51 && code <= 57) return 'Mayda yomgʻir';
  if (code >= 61 && code <= 67) return 'Yomgʻir';
  if (code >= 71 && code <= 77) return 'Qor';
  if (code >= 80 && code <= 82) return 'Jala';
  if (code === 85 || code === 86) return 'Qor yogʻishi';
  if (code >= 95) return 'Momaqaldiroq';
  return 'Maʼlum emas';
}

async function getJson(fetchFn: FetchLike, url: string): Promise<unknown> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 5000);
  try {
    const res = await fetchFn(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`upstream ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

interface CbuRow {
  Ccy: string;
  CcyNm_UZ: string;
  Rate: string;
  Diff: string;
  Date: string;
}

export function createWidgets(fetchFn: FetchLike, now: () => Date = () => new Date()) {
  const currency = new TtlCache<CurrencyRate[]>(30 * 60_000, now);
  const weather = new TtlCache<Omit<WeatherWidget, 'fetchedAt' | 'stale'>>(15 * 60_000, now);

  return {
    async currency(): Promise<CurrencyWidget> {
      try {
        const r = await currency.get(async () => {
          const rows = (await getJson(fetchFn, CBU_URL)) as CbuRow[];
          const items = CURRENCIES.flatMap((code) => {
            const row = rows.find((x) => x.Ccy === code);
            return row
              ? [
                  {
                    code,
                    name: row.CcyNm_UZ,
                    rate: Number(row.Rate),
                    diff: Number(row.Diff),
                    date: row.Date,
                  },
                ]
              : [];
          });
          if (items.length === 0) throw new Error('empty response');
          return items;
        });
        return {
          items: r.value,
          fetchedAt: r.fetchedAt.toISOString(),
          stale: r.stale,
          source: 'Markaziy bank',
        };
      } catch {
        throw new WidgetUnavailableError('Valyuta kurslari hozircha mavjud emas');
      }
    },
    async weather(): Promise<WeatherWidget> {
      try {
        const r = await weather.get(async () => {
          const data = (await getJson(fetchFn, WEATHER_URL)) as {
            current: { temperature_2m: number; weather_code: number };
            daily: { temperature_2m_max: number[] };
          };
          const code = data.current.weather_code;
          return {
            city: 'Toshkent',
            temperature: Math.round(data.current.temperature_2m),
            weatherCode: code,
            description: describeWeather(code),
            tomorrowMax: Math.round(
              data.daily.temperature_2m_max[1] ?? data.current.temperature_2m,
            ),
          };
        });
        return { ...r.value, fetchedAt: r.fetchedAt.toISOString(), stale: r.stale };
      } catch {
        throw new WidgetUnavailableError('Ob-havo maʼlumoti hozircha mavjud emas');
      }
    },
  };
}

export type Widgets = ReturnType<typeof createWidgets>;
