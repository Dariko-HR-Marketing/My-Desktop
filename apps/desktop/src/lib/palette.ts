import type { Task } from '@ish-maydoni/shared';
import { APPS } from '../features/browser/networks';
import { WORK_SITES } from '../features/browser/sites';
import { normalizeAddress } from './browser';
import type { MessageKey } from './i18n';
import { parseQuickAdd, type QuickAddResult } from './quickAdd';

export type PaletteFilter = 'all' | 'task' | 'doc' | 'web';
export const PALETTE_FILTERS: PaletteFilter[] = ['all', 'task', 'doc', 'web'];

export type PaletteAction =
  | { type: 'createTask'; parsed: QuickAddResult }
  | { type: 'navigate'; to: string }
  | { type: 'openApp'; key: string }
  | { type: 'openUrl'; url: string }
  | { type: 'disabled' };

export interface PaletteItem {
  id: string;
  title: string;
  hint?: string;
  /** Right-hand label such as "Enter" or "Modulda". */
  trailing?: string;
  action: PaletteAction;
}

export type SectionKey = 'actions' | 'tasks' | 'docs' | 'people' | 'apps' | 'web' | 'ai';
export interface PaletteSection {
  key: SectionKey;
  label: MessageKey;
  items: PaletteItem[];
}

export interface PaletteDoc {
  id: string;
  number: string;
  title: string;
}

export interface PaletteContext {
  tasks: Task[];
  docs: PaletteDoc[];
}

const fold = (s: string) => s.toLowerCase().replace(/[ʻʼ‘’`']/g, "'");
const matches = (haystack: string, needle: string) => fold(haystack).includes(fold(needle));

const MAX_PER_SECTION = 5;

/** Static actions shown for an empty query (and filtered by the query otherwise). */
const ACTIONS: { id: string; title: string; to: string; trailing: string }[] = [
  { id: 'a-new-task', title: 'Yangi vazifa yaratish', to: '/tasks?new=1', trailing: 'N' },
  { id: 'a-tasks', title: 'Vazifalarim', to: '/tasks', trailing: 'Ochish' },
  { id: 'a-browser', title: 'Brauzerni ochish', to: '/browser', trailing: 'Ochish' },
  { id: 'a-edo', title: 'Hujjat aylanishi', to: '/m/edo', trailing: 'Modulda' },
  { id: 'a-settings', title: 'Sozlamalar', to: '/settings', trailing: 'Ochish' },
  { id: 'a-home', title: 'Bosh sahifa', to: '/', trailing: 'Ochish' },
];

export function buildPalette(
  rawQuery: string,
  ctx: PaletteContext,
  filter: PaletteFilter = 'all',
): PaletteSection[] {
  const query = rawQuery.trim();
  const sections: PaletteSection[] = [];
  const want = (f: PaletteFilter) => filter === 'all' || filter === f;

  if (want('all') || want('task')) {
    const actions: PaletteItem[] = [];
    if (query) {
      const parsed = parseQuickAdd(query, new Date());
      if (parsed.title) {
        actions.push({
          id: 'create-task',
          title: `“${parsed.title}” nomli vazifa yaratish`,
          trailing: 'Enter',
          action: { type: 'createTask', parsed },
        });
      }
    }
    if (filter === 'all') {
      actions.push(
        ...ACTIONS.filter((a) => !query || matches(a.title, query)).map<PaletteItem>((a) => ({
          id: a.id,
          title: a.title,
          trailing: a.trailing,
          action: { type: 'navigate', to: a.to },
        })),
      );
    }
    if (actions.length)
      sections.push({
        key: 'actions',
        label: 'palette.actions',
        items: actions.slice(0, query ? 7 : 6),
      });
  }

  if (query && want('task')) {
    const tasks = ctx.tasks
      .filter(
        (x) =>
          matches(x.title, query) ||
          (x.assignee && matches(x.assignee, query)) ||
          (x.list && matches(x.list, query)),
      )
      .slice(0, MAX_PER_SECTION)
      .map<PaletteItem>((x) => ({
        id: `task-${x.id}`,
        title: x.title,
        hint: x.status === 'DONE' ? 'Bajarildi' : undefined,
        trailing: 'Ochish',
        action: { type: 'navigate', to: `/tasks?task=${x.id}` },
      }));
    if (tasks.length) sections.push({ key: 'tasks', label: 'palette.tasks', items: tasks });
  }

  if (query && want('doc')) {
    const docs = ctx.docs
      .filter((d) => matches(d.title, query) || matches(d.number, query))
      .slice(0, MAX_PER_SECTION)
      .map<PaletteItem>((d) => ({
        id: `doc-${d.id}`,
        title: d.title,
        hint: d.number,
        trailing: 'Modulda',
        action: { type: 'navigate', to: `/m/edo/documents?doc=${d.id}` },
      }));
    if (docs.length) sections.push({ key: 'docs', label: 'palette.docs', items: docs });
  }

  if (want('all') || want('web')) {
    const apps: PaletteItem[] = [];
    const seen = new Set<string>();
    for (const a of APPS) {
      const title = APP_TITLES[a.key] ?? a.key;
      if (query ? matches(title, query) || matches(a.key, query) : false) {
        apps.push({
          id: `app-${a.key}`,
          title,
          trailing: 'Ochish',
          action: { type: 'openApp', key: a.key },
        });
        seen.add(a.url);
      }
    }
    for (const s of WORK_SITES) {
      if (
        query &&
        matches(s.name, query) &&
        !seen.has(s.url) &&
        !apps.some((x) => x.title === s.name)
      ) {
        apps.push({
          id: `site-${s.key}`,
          title: s.name,
          trailing: 'Ochish',
          action: { type: 'openUrl', url: s.url },
        });
      }
    }
    if (apps.length)
      sections.push({ key: 'apps', label: 'palette.apps', items: apps.slice(0, MAX_PER_SECTION) });
  }

  if (query && want('web')) {
    const target = normalizeAddress(query);
    const web: PaletteItem[] = [];
    if (target.kind === 'url')
      web.push({
        id: 'web-open',
        title: `“${query}” manzilini ochish`,
        trailing: 'Enter',
        action: { type: 'openUrl', url: target.url },
      });
    const search = normalizeAddress(`https://www.google.com/search?q=${encodeURIComponent(query)}`);
    if (search.kind === 'url')
      web.push({
        id: 'web-google',
        title: `“${query}” ni Google’dan qidirish`,
        trailing: 'Ctrl Enter',
        action: { type: 'openUrl', url: search.url },
      });
    sections.push({ key: 'web', label: 'palette.web', items: web });
  }

  if (query && filter === 'all' && query.length > 2) {
    sections.push({
      key: 'ai',
      label: 'palette.ai',
      items: [
        {
          id: 'ai',
          title: `AI so‘rovi: “${query}”`,
          hint: 'Tez orada',
          action: { type: 'disabled' },
        },
      ],
    });
  }
  return sections;
}

const APP_TITLES: Record<string, string> = {
  telegram: 'Telegram',
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
  facebook: 'Facebook',
  youtube: 'YouTube',
  linkedin: 'LinkedIn',
  google: 'Google',
  lex: 'Lex.uz',
  mygov: 'my.gov.uz',
  soliq: 'soliq.uz',
};

export const flatten = (sections: PaletteSection[]): PaletteItem[] =>
  sections.flatMap((s) => s.items);

/** Move the highlighted row, wrapping at both ends; disabled rows are skipped. */
export function moveIndex(items: PaletteItem[], current: number, delta: 1 | -1): number {
  const enabled = items
    .map((it, i) => (it.action.type === 'disabled' ? -1 : i))
    .filter((i) => i >= 0);
  if (enabled.length === 0) return 0;
  const pos = enabled.indexOf(current);
  if (pos < 0) return enabled[0]!;
  return enabled[(pos + delta + enabled.length) % enabled.length]!;
}
