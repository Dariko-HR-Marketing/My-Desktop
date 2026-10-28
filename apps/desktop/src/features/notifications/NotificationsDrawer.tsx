import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, CheckCheck, Settings2, MessageSquare, type LucideIcon } from 'lucide-react';
import type { NotificationItem } from '@ish-maydoni/shared';
import { Button, Drawer, EmptyState, Skeleton, Switch, Tabs } from '../../components';
import { formatTime } from '../../lib/format';
import {
  countsByTab,
  filterByTab,
  groupNotifications,
  type NotificationTab,
} from '../../lib/notifications';
import { resolveActionUrl } from '../../lib/home';
import { t, tf, type MessageKey } from '../../lib/i18n';
import { updateSettings, useSettings } from '../../lib/settingsSync';
import { useNow } from '../../lib/useNow';
import { useBrowser } from '../../state/browser';
import { useData } from '../../state/data';
import { useUi } from '../../state/ui';
import { cx } from '../../lib/cx';
import './notifications.css';

const ICON: Record<NotificationItem['category'], LucideIcon> = {
  WORK: Briefcase,
  MESSAGE: MessageSquare,
  SYSTEM: Settings2,
};

export function NotificationsDrawer() {
  const open = useUi((s) => s.notificationsOpen);
  const setOpen = useUi((s) => s.setNotificationsOpen);
  const slice = useData((s) => s.notifications);
  const settings = useSettings();
  const navigate = useNavigate();
  const now = useNow();
  const [tab, setTab] = useState<NotificationTab>('all');

  const items = slice.data?.items ?? [];
  const counts = countsByTab(items);
  const groups = groupNotifications(filterByTab(items, tab), now);
  const close = () => setOpen(false);

  function runAction(n: NotificationItem) {
    useData.getState().markRead([n.id]);
    if (!n.actionUrl) return;
    const target = resolveActionUrl(n.actionUrl);
    close();
    if (target.internal) navigate(target.to);
    else {
      useBrowser.getState().openTab({ url: target.to });
      navigate('/browser');
    }
  }

  return (
    <Drawer open={open} onClose={close} title={t('notif.title')}>
      <div className="notif">
        <div className="notif__bar">
          <span className="t-caption" aria-live="polite">
            {counts.all > 0 ? tf('notif.new', { n: counts.all }) : t('notif.none')}
          </span>
          <Button
            variant="ghost"
            icon={CheckCheck}
            disabled={counts.all === 0}
            onClick={() => useData.getState().markRead('all')}
          >
            {t('notif.markAll')}
          </Button>
        </div>

        <Tabs
          label={t('notif.tabs')}
          value={tab}
          onChange={(k) => setTab(k as NotificationTab)}
          items={(['all', 'WORK', 'MESSAGE', 'SYSTEM'] as NotificationTab[]).map((k) => ({
            key: k,
            label: t(`notif.tab.${k}` as MessageKey),
            count: counts[k] || undefined,
          }))}
        />

        <div className="notif__list" aria-busy={slice.status === 'loading'}>
          {slice.status === 'loading' &&
            [1, 2, 3].map((i) => <Skeleton key={i} height={56} radius={10} />)}
          {slice.status === 'error' && (
            <EmptyState
              icon={Settings2}
              title={t('state.error')}
              description={t('state.errorText')}
            />
          )}
          {slice.status === 'ready' && groups.length === 0 && (
            <EmptyState
              icon={CheckCheck}
              tone="success"
              title={t('notif.empty')}
              description={t('notif.emptyText')}
            />
          )}
          {groups.map((g) => (
            <section key={g.key} aria-label={t(`notif.group.${g.key}` as MessageKey)}>
              <h3 className="t-overline notif__group">{t(`notif.group.${g.key}` as MessageKey)}</h3>
              <ul className="notif__items">
                {g.items.map((n) => {
                  const Icon = ICON[n.category];
                  const unread = n.readAt === null;
                  return (
                    <li key={n.id} className={cx('notif__item', unread && 'notif__item--unread')}>
                      <span className="notif__icon" aria-hidden="true">
                        <Icon size={18} strokeWidth={1.8} />
                      </span>
                      <button
                        type="button"
                        className="notif__main"
                        onClick={() => unread && useData.getState().markRead([n.id])}
                      >
                        <span className="notif__title">
                          {unread && (
                            <span
                              className="notif__dot"
                              role="img"
                              aria-label={t('notif.unreadMark')}
                            />
                          )}
                          {n.title}
                        </span>
                        {n.body && <span className="t-caption">{n.body}</span>}
                        <span className="t-caption mono">{formatTime(new Date(n.createdAt))}</span>
                      </button>
                      {n.actionLabel && n.actionUrl && (
                        <Button variant="secondary" onClick={() => runAction(n)}>
                          {n.actionLabel}
                        </Button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>

        <div className="notif__quiet">
          <div className="notif__quiet-head">
            <div>
              <div className="list__title">{t('notif.quiet')}</div>
              <div className="t-caption">{t('notif.quietHint')}</div>
            </div>
            <Switch
              checked={settings.quietEnabled}
              onChange={(v) => updateSettings({ quietEnabled: v })}
              label={t('notif.quiet')}
            />
          </div>
          {settings.quietEnabled && (
            <div className="row">
              <label className="t-caption" htmlFor="qf">
                {t('settings.quietFrom')}
              </label>
              <input
                id="qf"
                type="time"
                className="input notif__time"
                value={settings.quietFrom}
                onChange={(e) => e.target.value && updateSettings({ quietFrom: e.target.value })}
              />
              <label className="t-caption" htmlFor="qt">
                {t('settings.quietTo')}
              </label>
              <input
                id="qt"
                type="time"
                className="input notif__time"
                value={settings.quietTo}
                onChange={(e) => e.target.value && updateSettings({ quietTo: e.target.value })}
              />
            </div>
          )}
        </div>
      </div>
    </Drawer>
  );
}
