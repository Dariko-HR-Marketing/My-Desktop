// Home blocks that have no server endpoint yet (calendar, messengers, plan, attendance).
// They are shown with a "sample data" marker so nobody mistakes them for real figures.
export interface SampleMeeting {
  time: string;
  title: string;
  online: boolean;
}
export interface SampleMessage {
  app: 'telegram' | 'whatsapp' | 'mail';
  from: string;
  text: string;
  count: number;
}

export const SAMPLE_MEETINGS: SampleMeeting[] = [
  { time: '10:00', title: 'Boʻlim yigʻilishi', online: false },
  { time: '14:00', title: 'Loyiha muhokamasi', online: true },
  { time: '16:30', title: 'Rahbar bilan suhbat', online: false },
];

export const SAMPLE_MESSAGES: SampleMessage[] = [
  { app: 'telegram', from: 'Telegram', text: 'Hisobot qachon tayyor boʻladi?', count: 12 },
  { app: 'whatsapp', from: 'WhatsApp', text: 'Ertangi uchrashuv tasdiqlandi', count: 3 },
  { app: 'mail', from: 'Pochta', text: 'Tasdiqlash uchun hujjat yuborildi', count: 0 },
];

export const SAMPLE_PLAN_PERCENT = 68;
export const SAMPLE_ARRIVAL = '08:52';

/** First meeting that starts after `now` (HH:MM strings compare correctly). */
export function nextMeeting(meetings: SampleMeeting[], nowHHMM: string): SampleMeeting | null {
  return meetings.find((m) => m.time > nowHHMM) ?? null;
}
