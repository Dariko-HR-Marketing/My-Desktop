import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FileText, MailOpen } from 'lucide-react';
import type { EdoData, EdoDocument } from '@ish-maydoni/shared';
import { Button, Card, Chip, Drawer, EmptyState } from '../../../components';
import { cx } from '../../../lib/cx';
import { formatDate, formatTime } from '../../../lib/format';
import { useBreakpoint } from '../../../lib/layout';
import { useNow } from '../../../lib/useNow';
import { countDocs, filterDocs, leftLabel, type DocFilter } from './edoLogic';
import { te, type EdoKey } from './messages';

const FOLDERS: DocFilter[] = ['all', 'Kiruvchi', 'Chiquvchi', 'Ichki', 'Buyruq'];
const QUICK: DocFilter[] = ['today', 'important', 'unread', 'sign'];
const folderLabel = (f: DocFilter): string =>
  f === 'all' ? te('folder.all') : te(`folder.${f}` as EdoKey);
const quickLabel = (f: DocFilter): string => te(`quick.${f}` as EdoKey);

const when = (iso: string) => `${formatDate(new Date(iso))} ${formatTime(new Date(iso))}`;

function DocDetail({ doc, now }: { doc: EdoDocument; now: Date }) {
  return (
    <div className="stack docdetail">
      <div className="row">
        <Chip tone="info">{doc.type}</Chip>
        <Chip
          tone={doc.status === 'SIGN' ? 'warning' : doc.status === 'DONE' ? 'success' : 'neutral'}
        >
          {te(`status.${doc.status}` as EdoKey)}
        </Chip>
        {doc.due && (
          <Chip tone={new Date(doc.due) < now ? 'danger' : 'neutral'}>
            {te('doc.due')}: {leftLabel(doc.due, now)}
          </Chip>
        )}
      </div>
      <h2 className="t-title">{doc.title}</h2>
      <dl className="detail__facts">
        <dt>{te('doc.number')}</dt>
        <dd className="mono">{doc.number}</dd>
        <dt>{te('doc.date')}</dt>
        <dd className="mono">{when(doc.date)}</dd>
        <dt>{te('doc.from')}</dt>
        <dd>{doc.from}</dd>
      </dl>

      <div className="row">
        <Button variant="primary" disabled title={te('soon')}>
          {te('doc.sign')}
        </Button>
        <Button disabled title={te('soon')}>
          {te('doc.approve')}
        </Button>
        <Button disabled title={te('soon')}>
          {te('doc.forward')}
        </Button>
        <Button variant="danger-ghost" disabled title={te('soon')}>
          {te('doc.reject')}
        </Button>
      </div>

      {doc.resolution && (
        <section>
          <h3 className="t-overline edo__h">
            {te('doc.resolution')} · {doc.resolution.author}
          </h3>
          <p>{doc.resolution.text}</p>
        </section>
      )}
      <section>
        <h3 className="t-overline edo__h">{te('doc.summary')}</h3>
        <ul className="edo__bullets">
          {doc.summary.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </section>
      <section>
        <h3 className="t-overline edo__h">
          {te('doc.text')} · {te('doc.page', { n: doc.pages })}
        </h3>
        <p className="edo__paper">{doc.heading}</p>
      </section>
      <section>
        <h3 className="t-overline edo__h">{te('doc.route')}</h3>
        <ol className="route">
          {doc.route.map((r) => (
            <li key={r.who} className={cx('route__step', `route__step--${r.state}`)}>
              <span className="route__who">{r.who}</span>
              <span className="t-caption">{te(`route.${r.state}` as EdoKey)}</span>
            </li>
          ))}
        </ol>
      </section>
      <section>
        <h3 className="t-overline edo__h">{te('doc.files')}</h3>
        <ul className="list">
          {doc.files.map((f) => (
            <li key={f.name} className="list__row">
              <FileText size={16} aria-hidden="true" />
              <span className="list__main">{f.name}</span>
              <span className="t-caption mono">{f.size}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export function Documents({ data }: { data: EdoData }) {
  const now = useNow();
  const bp = useBreakpoint();
  const [params, setParams] = useSearchParams();
  const filter = (params.get('f') as DocFilter | null) ?? 'all';
  const docId = params.get('doc');
  const set = (patch: Record<string, string | null>) =>
    setParams(
      (p) => {
        const n = new URLSearchParams(p);
        for (const [k, v] of Object.entries(patch)) v === null ? n.delete(k) : n.set(k, v);
        return n;
      },
      { replace: true },
    );

  const counts = useMemo(() => countDocs(data.documents, now), [data.documents, now]);
  const list = useMemo(
    () => filterDocs(data.documents, filter, now),
    [data.documents, filter, now],
  );
  const current = data.documents.find((d) => d.id === docId) ?? null;
  const wide = bp === 'desktop';

  const folders = (
    <nav className="folders" aria-label={te('folder.title')}>
      <h2 className="t-overline edo__h">{te('folder.title')}</h2>
      {FOLDERS.map((f) => (
        <button
          key={f}
          type="button"
          className="folder"
          aria-current={filter === f ? 'true' : undefined}
          onClick={() => set({ f: f === 'all' ? null : f })}
        >
          <span>{folderLabel(f)}</span>
          <Chip>{counts[f]}</Chip>
        </button>
      ))}
      <h2 className="t-overline edo__h">{te('quick.title')}</h2>
      {QUICK.map((f) => (
        <button
          key={f}
          type="button"
          className="folder"
          aria-current={filter === f ? 'true' : undefined}
          onClick={() => set({ f })}
        >
          <span>{quickLabel(f)}</span>
          <Chip tone={f === 'sign' ? 'warning' : 'neutral'}>{counts[f]}</Chip>
        </button>
      ))}
    </nav>
  );

  const rows = (
    <Card className="doclist">
      {list.length === 0 ? (
        <EmptyState icon={MailOpen} title={te('docs.empty')} description={te('docs.emptyText')} />
      ) : (
        <ul className="list">
          {list.map((d) => (
            <li key={d.id} className="list__row">
              <button
                type="button"
                className={cx('docrow', d.id === docId && 'docrow--on')}
                aria-current={d.id === docId ? 'true' : undefined}
                onClick={() => set({ doc: d.id })}
              >
                <span className="docrow__top">
                  <span className={cx('list__title', d.unread && 'docrow__unread')}>{d.title}</span>
                </span>
                <span className="t-caption">
                  {d.from} · <span className="mono">{formatTime(new Date(d.date))}</span> · {d.type}
                  {d.due ? ` · ${te('doc.due')}: ${leftLabel(d.due, now)}` : ''}
                </span>
              </button>
              {d.important && <Chip tone="danger">{te('doc.important')}</Chip>}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );

  return (
    <div className="docs" data-wide={wide ? 'true' : undefined} data-bp={bp}>
      {wide ? (
        <Card className="docs__folders">{folders}</Card>
      ) : (
        <details className="docs__folders-m">
          <summary>
            {folderLabel(FOLDERS.includes(filter) ? filter : 'all')} · {te('folder.title')}
          </summary>
          {folders}
        </details>
      )}
      {rows}
      {wide ? (
        <Card className="docs__detail">
          {current ? (
            <DocDetail doc={current} now={now} />
          ) : (
            <EmptyState icon={FileText} title={te('docs.pick')} description={te('docs.pickText')} />
          )}
        </Card>
      ) : (
        <Drawer open={!!current} onClose={() => set({ doc: null })} title={current?.number ?? ''}>
          {current && <DocDetail doc={current} now={now} />}
        </Drawer>
      )}
    </div>
  );
}
