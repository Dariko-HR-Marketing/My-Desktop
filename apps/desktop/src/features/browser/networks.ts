import { Camera, MessageCircle, Play, Send, Users, Briefcase, type LucideIcon } from 'lucide-react';
import type { MessageKey } from '../../lib/i18n';

/** Sidebar network entries. The real list comes from /api/catalog/apps once the shell is wired to the API. */
export interface NetworkApp {
  key: string;
  name: MessageKey;
  url: string;
  /** Hostnames that belong to this app, for matching open tabs. */
  hosts: string[];
  icon: LucideIcon;
  /** CSS variable holding the brand colour, from design-tokens.json → apps. */
  color: string;
}

export const NETWORKS: NetworkApp[] = [
  {
    key: 'telegram',
    name: 'app.telegram',
    url: 'https://web.telegram.org/a/',
    hosts: ['web.telegram.org', 'telegram.org'],
    icon: Send,
    color: 'var(--app-telegram)',
  },
  {
    key: 'whatsapp',
    name: 'app.whatsapp',
    url: 'https://web.whatsapp.com/',
    hosts: ['web.whatsapp.com', 'whatsapp.com'],
    icon: MessageCircle,
    color: 'var(--app-whatsapp)',
  },
  {
    key: 'instagram',
    name: 'app.instagram',
    url: 'https://www.instagram.com/',
    hosts: ['instagram.com'],
    icon: Camera,
    color: 'var(--app-instagram)',
  },
  {
    key: 'facebook',
    name: 'app.facebook',
    url: 'https://www.facebook.com/',
    hosts: ['facebook.com'],
    icon: Users,
    color: 'var(--app-facebook)',
  },
  {
    key: 'youtube',
    name: 'app.youtube',
    url: 'https://www.youtube.com/',
    hosts: ['youtube.com', 'youtu.be'],
    icon: Play,
    color: 'var(--app-youtube)',
  },
  {
    key: 'linkedin',
    name: 'app.linkedin',
    url: 'https://www.linkedin.com/',
    hosts: ['linkedin.com'],
    icon: Briefcase,
    color: 'var(--app-linkedin)',
  },
];
