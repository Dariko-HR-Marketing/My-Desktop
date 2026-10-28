const MONTHS = [
  'yanvar',
  'fevral',
  'mart',
  'aprel',
  'may',
  'iyun',
  'iyul',
  'avgust',
  'sentabr',
  'oktabr',
  'noyabr',
  'dekabr',
];
const pad = (n: number) => String(n).padStart(2, '0');

/** 09:02 */
export const formatTime = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

/** 28-oktabr */
export const formatDate = (d: Date) => `${d.getDate()}-${MONTHS[d.getMonth()]}`;

/** Up to two initials; "AK" for "Aziz Karimov", "I" for no name. */
export function initials(name?: string | null): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'I';
  return parts
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('');
}
