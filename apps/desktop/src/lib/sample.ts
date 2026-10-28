// Home blocks that have no server endpoint yet (messengers, plan, attendance).
// They are shown with a "sample data" marker so nobody mistakes them for real figures.
export interface SampleMessage {
  app: 'telegram' | 'whatsapp' | 'mail';
  from: string;
  text: string;
  count: number;
}

export const SAMPLE_MESSAGES: SampleMessage[] = [
  { app: 'telegram', from: 'Telegram', text: 'Hisobot qachon tayyor boʻladi?', count: 12 },
  { app: 'whatsapp', from: 'WhatsApp', text: 'Ertangi uchrashuv tasdiqlandi', count: 3 },
  { app: 'mail', from: 'Pochta', text: 'Tasdiqlash uchun hujjat yuborildi', count: 0 },
];

export const SAMPLE_PLAN_PERCENT = 68;
export const SAMPLE_ARRIVAL = '08:52';
