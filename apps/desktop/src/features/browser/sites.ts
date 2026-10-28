/** "Ish saytlari" tiles on the new-tab page. */
export interface WorkSite {
  key: string;
  name: string;
  url: string;
}

export const WORK_SITES: WorkSite[] = [
  { key: 'lex', name: 'Lex.uz', url: 'https://lex.uz/' },
  { key: 'mygov', name: 'my.gov.uz', url: 'https://my.gov.uz/' },
  { key: 'soliq', name: 'soliq.uz', url: 'https://soliq.uz/' },
  { key: 'eimzo', name: 'E-IMZO', url: 'https://e-imzo.uz/' },
  { key: 'didox', name: 'Didox', url: 'https://didox.uz/' },
  { key: 'gov', name: 'gov.uz', url: 'https://gov.uz/' },
];

export const GOOGLE_SEARCH = 'https://www.google.com/search?q=';

/** Start-page tiles that are not sidebar networks. */
export const EXTRA_TILES = [
  {
    key: 'google',
    name: 'app.google',
    url: 'https://www.google.com/',
    color: 'var(--app-mail)',
  },
  {
    key: 'mail',
    name: 'browser.start.mail',
    url: 'https://mail.google.com/',
    color: 'var(--app-video)',
  },
] as const;
