import { describe, expect, it } from 'vitest';
import { parseQuickAdd } from './quickAdd';

// Wednesday, 28 October 2026, 12:00 local time
const now = new Date(2026, 9, 28, 12, 0);
const at = (y: number, m: number, d: number, h = 18, mi = 0) => new Date(y, m - 1, d, h, mi);
const parse = (s: string) => parseQuickAdd(s, now);

describe('quickAdd — the full example', () => {
  it('splits date, time, priority, assignee and list out of the title', () => {
    const r = parse('ertaga 10:00 hisobot !yuqori @Karimov #ishreja');
    expect(r).toMatchObject({
      title: 'hisobot',
      priority: 'HIGH',
      assignee: 'Karimov',
      list: 'ishreja',
    });
    expect(r.dueAt).toEqual(at(2026, 10, 29, 10, 0));
    expect(r.chips.map((c) => c.kind)).toEqual(['date', 'time', 'priority', 'assignee', 'list']);
    expect(r.chips.map((c) => c.label)).toEqual([
      '29-oktabr',
      '10:00',
      'Yuqori',
      '@Karimov',
      '#ishreja',
    ]);
  });
});

describe('quickAdd — dates', () => {
  it.each([
    ['hisobot bugun', at(2026, 10, 28)],
    ['hisobot ertaga', at(2026, 10, 29)],
    ['hisobot indinga', at(2026, 10, 30)],
  ])('%s defaults to 18:00', (input, expected) => {
    expect(parse(input).dueAt).toEqual(expected);
    expect(parse(input).title).toBe('hisobot');
  });

  it('resolves weekdays to the next occurrence, never today', () => {
    expect(parse('dushanba yigʻilish').dueAt).toEqual(at(2026, 11, 2));
    expect(parse('chorshanba yigʻilish').dueAt).toEqual(at(2026, 11, 4)); // today is Wednesday
    expect(parse('yakshanba').dueAt).toEqual(at(2026, 11, 1));
    expect(parse('shanba').dueAt).toEqual(at(2026, 10, 31));
  });

  it('parses "5-noyabr" and "5 noyabr"', () => {
    expect(parse('5-noyabr hisobot').dueAt).toEqual(at(2026, 11, 5));
    expect(parse('hisobot 5 noyabr').dueAt).toEqual(at(2026, 11, 5));
    expect(parse('hisobot 5 noyabr').title).toBe('hisobot');
  });

  it('rolls a day-month that already passed into next year', () => {
    expect(parse('5-yanvar').dueAt).toEqual(at(2027, 1, 5));
    expect(parse('28-oktabr').dueAt).toEqual(at(2026, 10, 28)); // today is not "passed"
  });

  it('parses dd.mm and dd.mm.yyyy', () => {
    expect(parse('28.10 hisobot').dueAt).toEqual(at(2026, 10, 28));
    expect(parse('5.11').dueAt).toEqual(at(2026, 11, 5));
    expect(parse('27.10').dueAt).toEqual(at(2027, 10, 27));
    expect(parse('hisobot 28.10.2026').dueAt).toEqual(at(2026, 10, 28));
    expect(parse('01.01.2030').dueAt).toEqual(at(2030, 1, 1));
  });

  it('ignores impossible dates and leaves them in the title', () => {
    const r = parse('31.02 hisobot');
    expect(r.dueAt).toBeNull();
    expect(r.title).toBe('31.02 hisobot');
    expect(parse('31.02.2026').dueAt).toBeNull();
  });
});

describe('quickAdd — time', () => {
  it('accepts 10:00 and 10.00', () => {
    expect(parse('ertaga 10:00').dueAt).toEqual(at(2026, 10, 29, 10, 0));
    expect(parse('ertaga 10.00').dueAt).toEqual(at(2026, 10, 29, 10, 0));
    expect(parse('ertaga 9:05').dueAt).toEqual(at(2026, 10, 29, 9, 5));
  });

  it('uses today when only a future time is given', () => {
    expect(parse('qoʻngʻiroq 15:30').dueAt).toEqual(at(2026, 10, 28, 15, 30));
  });

  it('moves a time that already passed to tomorrow', () => {
    expect(parse('qoʻngʻiroq 10:00').dueAt).toEqual(at(2026, 10, 29, 10, 0));
    expect(parse('qoʻngʻiroq 12:00').dueAt).toEqual(at(2026, 10, 29, 12, 0)); // exactly now counts as passed
  });

  it('rejects invalid clock values', () => {
    expect(parse('25:00 hisobot').dueAt).toBeNull();
    expect(parse('10:75 hisobot').dueAt).toBeNull();
  });

  it('reads 10.30 as a time (month 30 does not exist) and 28.10 as a date', () => {
    expect(parse('10.30 uchrashuv').dueAt).toEqual(at(2026, 10, 29, 10, 30));
    expect(parse('28.10 uchrashuv').dueAt).toEqual(at(2026, 10, 28));
  });

  it('treats an ambiguous 10.10 as a date, unless a date is already given', () => {
    expect(parse('10.10').dueAt).toEqual(at(2027, 10, 10));
    expect(parse('ertaga 10.10').dueAt).toEqual(at(2026, 10, 29, 10, 10));
  });
});

describe('quickAdd — priority, assignee, list', () => {
  it.each([
    ['!yuqori', 'HIGH'],
    ['!muhim', 'HIGH'],
    ['!past', 'LOW'],
    ['!oddiy', 'NORMAL'],
    ['!Yuqori', 'HIGH'],
    ['!MUHIM', 'HIGH'],
  ])('%s → %s', (token, expected) => {
    const r = parse(`hisobot ${token}`);
    expect(r.priority).toBe(expected);
    expect(r.title).toBe('hisobot');
  });

  it('leaves unknown !words in the title', () => {
    expect(parse('hisobot !zudlik')).toMatchObject({ priority: null, title: 'hisobot !zudlik' });
  });

  it('extracts @assignee and #list anywhere in the line', () => {
    expect(parse('@Aliyev hisobot #moliya')).toMatchObject({
      title: 'hisobot',
      assignee: 'Aliyev',
      list: 'moliya',
    });
  });

  it('keeps modifier apostrophes inside names', () => {
    expect(parse('hisobot @Oʻktamov').assignee).toBe('Oʻktamov');
  });

  it('does not treat an e-mail address as an assignee', () => {
    expect(parse('xat yuborish a@b.uz')).toMatchObject({
      assignee: null,
      title: 'xat yuborish a@b.uz',
    });
  });
});

describe('quickAdd — typography and edge cases', () => {
  it('keeps typographic apostrophes in the title', () => {
    expect(parse('Oʻqish rejasi ertaga').title).toBe('Oʻqish rejasi');
    expect(parse('Boʼlim yigʻilishi 15:00').title).toBe('Boʼlim yigʻilishi');
  });

  it('is case-insensitive for keywords', () => {
    expect(parse('ERTAGA hisobot').dueAt).toEqual(at(2026, 10, 29));
    expect(parse('Dushanba hisobot').dueAt).toEqual(at(2026, 11, 2));
  });

  it('does not match keywords inside other words', () => {
    expect(parse('bugungi hisobot')).toMatchObject({ dueAt: null, title: 'bugungi hisobot' });
    expect(parse('ertagalik ish').dueAt).toBeNull();
  });

  it('plain text has no due date and no chips', () => {
    expect(parse('hisobot yozish')).toEqual({
      title: 'hisobot yozish',
      dueAt: null,
      priority: null,
      assignee: null,
      list: null,
      chips: [],
    });
  });

  it('returns an empty title when nothing but tokens was typed', () => {
    expect(parse('ertaga !yuqori').title).toBe('');
    expect(parse('').title).toBe('');
    expect(parse('   ').title).toBe('');
  });

  it('uses only the first token of each kind', () => {
    const r = parse('ertaga indinga hisobot');
    expect(r.dueAt).toEqual(at(2026, 10, 29));
    expect(r.title).toBe('indinga hisobot');
  });

  it('chip ranges point into the original input', () => {
    const input = 'ertaga 10:00 hisobot !yuqori';
    const r = parse(input);
    expect(r.chips.map((c) => input.slice(c.start, c.end))).toEqual(['ertaga', '10:00', '!yuqori']);
  });
});
