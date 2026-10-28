import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import { FileText, type LucideIcon } from 'lucide-react';
import type { Role } from '@ish-maydoni/shared';
import type { MessageKey } from '../../lib/i18n';

/** Module manifest. The shell knows modules only through this list (docs/02 §4.3). */
export interface DesktopModule {
  key: string;
  name: MessageKey;
  subtitle: MessageKey;
  icon: LucideIcon;
  roles: Role[];
  /** Lazily loaded so a module's code is only fetched when it is opened. */
  component: LazyExoticComponent<ComponentType>;
}

export const MODULES: DesktopModule[] = [
  {
    key: 'edo',
    name: 'module.edo',
    subtitle: 'module.edo.sub',
    icon: FileText,
    roles: ['EMPLOYEE', 'MANAGER', 'ADMIN'],
    component: lazy(() => import('./edo/EdoModule')),
  },
];

export const modulesForRole = (role: Role) => MODULES.filter((m) => m.roles.includes(role));
