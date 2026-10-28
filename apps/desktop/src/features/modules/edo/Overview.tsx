import { Link } from 'react-router-dom';
import type { EdoData } from '@ish-maydoni/shared';
import { Card, Chip, EmptyState, Kpi } from '../../../components';
import { CheckCircle2 } from 'lucide-react';
import { formatDate, formatTime } from '../../../lib/format';
import { useNow } from '../../../lib/useNow';
import { leftLabel, signDocs, upcomingRows } from './edoLogic';
import { te } from './messages';

export function Overview({ data }: { data: EdoData }) {
  const now = useNow();
  const sign = signDocs(data.documents);
  const incoming = data.documents.filter(
    (d) => d.type === 'Kiruvchi' && d.status !== 'DONE',
  ).length;
  const approval = data.documents.filter((d) => d.status === 'APPROVAL').length;
  const upcoming = upcomingRows(data.control.rows);

  return (
    <div className="stack">
      <div className="grid-kpi">
        <Link to="/m/edo/documents" className="kpi-link">
          <Kpi label={te('kpi.sign')} value={sign.length} tone="info" />
        </Link>
        <Kpi label={te('kpi.incoming')} value={incoming} />
        <Kpi label={te('kpi.approval')} value={approval} />
        <Link to="/m/edo/control" className="kpi-link">
          <Kpi
            label={te('kpi.overdue')}
            value={data.control.counters.overdue}
            tone={data.control.counters.overdue ? 'danger' : 'default'}
          />
        </Link>
      </div>
      <div className="edo__two">
        <Card title={te('overview.sign')} action={<Link to="/m/edo/documents">{te('all')} →</Link>}>
          {sign.length === 0 ? (
            <EmptyState icon={CheckCircle2} tone="success" title={te('overview.signEmpty')} />
          ) : (
            <ul className="list">
              {sign.slice(0, 5).map((d) => (
                <li key={d.id} className="list__row">
                  <div className="list__main">
                    <span className="list__title">{d.title}</span>
                    <span className="t-caption">
                      {d.number} · {d.from} ·{' '}
                      {d.due
                        ? `${formatDate(new Date(d.due))} ${formatTime(new Date(d.due))}`
                        : '—'}
                    </span>
                  </div>
                  <Link className="btn btn--secondary" to={`/m/edo/documents?doc=${d.id}`}>
                    {te('open')}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card
          title={te('overview.deadlines')}
          action={<Link to="/m/edo/control">{te('control')}</Link>}
        >
          {upcoming.length === 0 ? (
            <EmptyState icon={CheckCircle2} tone="success" title={te('overview.deadlinesEmpty')} />
          ) : (
            <ul className="list">
              {upcoming.map((r) => (
                <li key={r.id} className="list__row">
                  <div className="list__main">
                    <span className="list__title">{r.title}</span>
                    <span className="t-caption">{r.sub}</span>
                  </div>
                  <Chip
                    tone={
                      r.status === 'OVERDUE'
                        ? 'danger'
                        : r.status === 'TODAY'
                          ? 'warning'
                          : 'neutral'
                    }
                  >
                    {leftLabel(r.due, now)}
                  </Chip>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
