import { Camera, MessageCircle, Play, Send, Users, Briefcase, type LucideIcon } from 'lucide-react';
import type { MessageKey } from '../../lib/i18n';

/** Sidebar network entries. The real list comes from /api/catalog/apps once the shell is wired to the API. */
export interface NetworkApp {
  key: string;
  name: MessageKey;
  icon: LucideIcon;
  /** CSS variable holding the brand colour, from design-tokens.json → apps. */
  color: string;
}

export const NETWORKS: NetworkApp[] = [
  { key: 'telegram', name: 'app.telegram', icon: Send, color: 'var(--app-telegram)' },
  { key: 'whatsapp', name: 'app.whatsapp', icon: MessageCircle, color: 'var(--app-whatsapp)' },
  { key: 'instagram', name: 'app.instagram', icon: Camera, color: 'var(--app-instagram)' },
  { key: 'facebook', name: 'app.facebook', icon: Users, color: 'var(--app-facebook)' },
  { key: 'youtube', name: 'app.youtube', icon: Play, color: 'var(--app-youtube)' },
  { key: 'linkedin', name: 'app.linkedin', icon: Briefcase, color: 'var(--app-linkedin)' },
];
