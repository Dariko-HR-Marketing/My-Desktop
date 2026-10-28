import { Fragment } from 'react';
import { Plus, X } from 'lucide-react';
import { Badge, IconButton } from '../../components';
import { displayUrl } from '../../lib/browser';
import { t } from '../../lib/i18n';
import { GROUPS, useBrowser, type Tab } from '../../state/browser';
import { cx } from '../../lib/cx';

const label = (tab: Tab) => tab.title || (tab.url ? displayUrl(tab.url) : t('browser.newTabTitle'));

export function TabStrip() {
  const tabs = useBrowser((s) => s.tabs);
  const activeId = useBrowser((s) => s.activeId);
  const { activate, closeTab, openTab } = useBrowser.getState();

  return (
    <div className="tabstrip">
      <ul className="tabstrip__tabs" aria-label={t('browser.tabs')}>
        {tabs.map((tab, i) => {
          const group = tab.groupId ? GROUPS[tab.groupId] : null;
          const startsGroup = tab.groupId && tabs[i - 1]?.groupId !== tab.groupId;
          const active = tab.id === activeId;
          return (
            <Fragment key={tab.id}>
              {startsGroup && group && (
                <li className="tabgroup" style={{ background: group.color }}>
                  {t(`browser.group.${tab.groupId}` as 'browser.group.muloqot')}
                </li>
              )}
              <li
                className={cx('tab', active && 'tab--active', tab.sleeping && 'tab--sleeping')}
                style={group ? { ['--tab-group' as string]: group.color } : undefined}
                data-grouped={group ? 'true' : undefined}
              >
                <button
                  type="button"
                  aria-current={active ? 'true' : undefined}
                  className="tab__main"
                  onClick={() => activate(tab.id)}
                  title={tab.url || undefined}
                >
                  <span className="tab__title">{label(tab)}</span>
                  {tab.sleeping && <span className="tab__sleep">{t('browser.sleeping')}</span>}
                  {tab.unread > 0 && <Badge count={tab.unread} tone="danger" />}
                </button>
                <button
                  type="button"
                  className="tab__close"
                  aria-label={`${t('browser.closeTab')}: ${label(tab)}`}
                  onClick={() => closeTab(tab.id)}
                >
                  <X size={14} strokeWidth={2} aria-hidden="true" />
                </button>
              </li>
            </Fragment>
          );
        })}
      </ul>
      <IconButton
        className="tabstrip__new"
        label={`${t('browser.newTab')} (Ctrl+T)`}
        icon={Plus}
        onClick={() => openTab()}
      />
    </div>
  );
}
