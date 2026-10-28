import {
  Briefcase,
  Camera,
  Landmark,
  MessageCircle,
  Play,
  Search,
  Send,
  Users,
  type LucideIcon,
} from 'lucide-react';
import type { MessageKey } from '../../lib/i18n';

/** Entries of the menu's networks group and the settings list. Mirrors the server catalog (/api/catalog/apps). */
export interface AppEntry {
  key: string;
  name: MessageKey;
  url: string;
  /** Hostnames that belong to this app, for matching open tabs. */
  hosts: string[];
  icon: LucideIcon;
  /** CSS variable holding the brand colour, from design-tokens.json → apps. */
  color: string;
  /** Enforced by the administrator: always shown, cannot be switched off. */
  mandatory: boolean;
}

export type NetworkApp = AppEntry;

export const NETWORKS: AppEntry[] = [
  {
    key: 'telegram',
    name: 'app.telegram',
    url: 'https://web.telegram.org/a/',
    hosts: ['web.telegram.org', 'telegram.org'],
    icon: Send,
    color: 'var(--app-telegram)',
    mandatory: false,
  },
  {
    key: 'whatsapp',
    name: 'app.whatsapp',
    url: 'https://web.whatsapp.com/',
    hosts: ['web.whatsapp.com', 'whatsapp.com'],
    icon: MessageCircle,
    color: 'var(--app-whatsapp)',
    mandatory: false,
  },
  {
    key: 'instagram',
    name: 'app.instagram',
    url: 'https://www.instagram.com/',
    hosts: ['instagram.com'],
    icon: Camera,
    color: 'var(--app-instagram)',
    mandatory: false,
  },
  {
    key: 'facebook',
    name: 'app.facebook',
    url: 'https://www.facebook.com/',
    hosts: ['facebook.com'],
    icon: Users,
    color: 'var(--app-facebook)',
    mandatory: false,
  },
  {
    key: 'youtube',
    name: 'app.youtube',
    url: 'https://www.youtube.com/',
    hosts: ['youtube.com', 'youtu.be'],
    icon: Play,
    color: 'var(--app-youtube)',
    mandatory: false,
  },
  {
    key: 'linkedin',
    name: 'app.linkedin',
    url: 'https://www.linkedin.com/',
    hosts: ['linkedin.com'],
    icon: Briefcase,
    color: 'var(--app-linkedin)',
    mandatory: false,
  },
];

export const APPS: AppEntry[] = [
  ...NETWORKS,
  {
    key: 'google',
    name: 'app.google',
    url: 'https://www.google.com/',
    hosts: ['google.com'],
    icon: Search,
    color: 'var(--app-mail)',
    mandatory: false,
  },
  {
    key: 'lex',
    name: 'app.lex',
    url: 'https://lex.uz/',
    hosts: ['lex.uz'],
    icon: Landmark,
    color: 'var(--app-gov)',
    mandatory: true,
  },
  {
    key: 'mygov',
    name: 'app.mygov',
    url: 'https://my.gov.uz/',
    hosts: ['my.gov.uz'],
    icon: Landmark,
    color: 'var(--app-gov)',
    mandatory: false,
  },
  {
    key: 'soliq',
    name: 'app.soliq',
    url: 'https://soliq.uz/',
    hosts: ['soliq.uz'],
    icon: Landmark,
    color: 'var(--app-gov)',
    mandatory: false,
  },
];

export const appByKey = (key: string) => APPS.find((a) => a.key === key);
