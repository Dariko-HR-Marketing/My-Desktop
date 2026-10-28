import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Columns2,
  Download,
  Lock,
  LockOpen,
  PictureInPicture2,
  RotateCw,
} from 'lucide-react';
import { TopbarActions } from '../../app/TopbarActions';
import { IconButton, Tooltip } from '../../components';
import { isSecure, normalizeAddress } from '../../lib/browser';
import { bridge } from '../../lib/browserBridge';
import { t } from '../../lib/i18n';
import { GROUPS, useBrowser, type GroupId, type Tab } from '../../state/browser';
import { useToast } from '../../state/toast';

export interface AddressBarProps {
  tab: Tab | undefined;
  /** Phone layout: only navigation buttons and the field. */
  compact?: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

export function AddressBar({ tab, compact, inputRef }: AddressBarProps) {
  const [text, setText] = useState(tab?.url ?? '');
  const editing = useRef(false);

  // Follow the page's address unless the user is typing.
  useEffect(() => {
    if (!editing.current) setText(tab?.url ?? '');
  }, [tab?.id, tab?.url]);

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!tab) return;
    const target = normalizeAddress(text);
    if (target.kind === 'invalid') {
      useToast.getState().push(t('browser.badAddress'));
      return;
    }
    editing.current = false;
    useBrowser.getState().navigate(tab.id, target.url);
    inputRef.current?.blur();
  }

  const hasPage = !!tab?.url;
  const history = (a: 'back' | 'forward' | 'reload') =>
    tab && void bridge.history(tab.id, a).catch(() => {});

  return (
    <div className="addressbar">
      <IconButton
        label={t('browser.back')}
        icon={ArrowLeft}
        disabled={!hasPage}
        onClick={() => history('back')}
      />
      <IconButton
        label={t('browser.forward')}
        icon={ArrowRight}
        disabled={!hasPage}
        onClick={() => history('forward')}
      />
      <IconButton
        label={t('browser.reload')}
        icon={RotateCw}
        disabled={!hasPage}
        onClick={() => history('reload')}
      />
      <form className="addressbar__form" onSubmit={submit} role="search">
        {hasPage && (
          <Tooltip
            content={isSecure(tab!.url) ? t('browser.secure') : t('browser.insecure')}
            side="bottom"
          >
            <span
              className={
                isSecure(tab!.url)
                  ? 'addressbar__lock addressbar__lock--ok'
                  : 'addressbar__lock addressbar__lock--warn'
              }
              role="img"
              aria-label={isSecure(tab!.url) ? t('browser.secure') : t('browser.insecure')}
            >
              {isSecure(tab!.url) ? (
                <Lock size={16} strokeWidth={1.8} />
              ) : (
                <LockOpen size={16} strokeWidth={1.8} />
              )}
            </span>
          </Tooltip>
        )}
        <input
          ref={inputRef}
          className="addressbar__input"
          aria-label={t('browser.address')}
          placeholder={t('browser.addressPlaceholder')}
          value={text}
          spellCheck={false}
          autoCapitalize="none"
          autoCorrect="off"
          onFocus={(e) => {
            editing.current = true;
            e.target.select();
          }}
          onBlur={() => {
            editing.current = false;
            setText(tab?.url ?? '');
          }}
          onChange={(e) => setText(e.target.value)}
        />
      </form>
      {!compact && (
        <>
          <IconButton label={t('browser.pip')} icon={PictureInPicture2} disabled />
          <IconButton label={t('browser.split')} icon={Columns2} disabled />
          <IconButton label={t('browser.downloads')} icon={Download} disabled />
          {tab && (
            <select
              className="select addressbar__group"
              aria-label={t('browser.group')}
              value={tab.groupId ?? ''}
              onChange={(e) =>
                useBrowser.getState().setGroup(tab.id, (e.target.value || null) as GroupId | null)
              }
            >
              <option value="">{t('browser.group.none')}</option>
              {(Object.keys(GROUPS) as GroupId[]).map((g) => (
                <option key={g} value={g}>
                  {t(`browser.group.${g}` as 'browser.group.ish')}
                </option>
              ))}
            </select>
          )}
          <span className="addressbar__sep" aria-hidden="true" />
          <TopbarActions />
        </>
      )}
    </div>
  );
}
