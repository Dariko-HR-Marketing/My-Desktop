import { useState } from 'react';
import { CheckCircle2, FileDown } from 'lucide-react';
import type { EdoControlKind, EdoData } from '@ish-maydoni/shared';
import { Button, Card, Chip, EmptyState, Kpi, Tabs } from '../../../components';
import { formatDate, formatTime } from '../../../lib/format';
import { useNow } from '../../../lib/useNow';
import { useData } from '../../../state/data';
import { useToast } from '../../../state/toast';
import { leftLabel, recommendations, sortControlRows } from './edoLogic';
import { te, type EdoKey } from './messages';

type Tab = 'all' | EdoControlKind;
const TABS: Tab[] = ['all', 'assignment', 'appeal', 'payment'];
const TONE = { OVERDUE: 'danger', TODAY: 'warning', SOON: 'info', PLANNED: 'neutral' } as const;

function Ring({ percent }: { percent: number }) {
  const r = 38;
  const c = 2 * Math.PI * r;
  return (
    <svg width="96" height="96" viewBox="0 0 96 96" role="img" aria-label={`${percent}%`}>
      <circle cx="48" cy="48" r={r} fill="none" stroke="var(--neutral-chip)" strokeWidth="10" />
      <circle
        cx="48"
        cy="48"
        r={r}
        fill="none"
        stroke="var(--success-solid)"
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={`${(c * percent) / 100} ${c}`}
        transform="rotate(-90 48 48)"
      />
      <text x="48" y="54" textAnchor="middle" fontSize="20" fontWeight="600" fill="var(--text)">
        {percent}%
      </text>
    </svg>
  );
}

export function Control({ data }: { data: EdoData }) {
  const now = useNow();
  const [tab, setTab] = useState<Tab>('all');
  const { control } = data;
  const rows = sortControlRows(control.rows).filter((r) => tab === 'all' || r.kind === tab);
  const reco = recommendations(control.rows);
  const appealLeft = leftLabel(control.appeal.due, now);

  function addToPlan() {
    const due = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18, 0);
    for (const r of reco)
      useData
        .getState()
        .createTask({ title: `${r.title}: ${r.sub}`, dueAt: due, priority: 'HIGH' });
    useToast.getState().push(te('control.recoAdded', { n: reco.length }));
  }

  return (
    <div className="stack">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div>
          <h2 className="t-title">{te('control.title')}</h2>
          <p className="t-caption">{te('control.lead')}</p>
        </div>
        <Button icon={FileDown} disabled title={te('soon')}>
          {te('control.report')}
        </Button>
      </div>

      <div className="control__top">
        <Card className="discipline">
          <Ring percent={control.discipline.percent} />
          <div>
            <div className="t-section">{te('control.discipline')}</div>
            <div>
              {te('control.onTime', { a: control.discipline.onTime, b: control.discipline.total })}
            </div>
            <div className="t-caption">
              {te('control.avg', {
                a: control.discipline.deptAverage,
                b: control.discipline.previousMonth,
              })}
            </div>
          </div>
        </Card>
        <div className="grid-kpi control__kpis">
          <Kpi
            label={te('control.overdue')}
            value={control.counters.overdue}
            tone={control.counters.overdue ? 'danger' : 'default'}
          />
          <Kpi label={te('control.today')} value={control.counters.today} />
          <Kpi label={te('control.soon')} value={control.counters.soon} />
          <Kpi label={te('control.planned')} value={control.counters.planned} />
        </div>
      </div>

      <Card title={te('control.stages')}>
        <p className="t-caption">{te('control.stagesLead')}</p>
        <ol className="stages">
          {control.stages.map((s, i) => (
            <li key={s.name} className="stage">
              <span className="stage__n">{i + 1}</span>
              <span className="list__title">{s.name}</span>
              <Chip tone={i === 3 ? 'danger' : i === 2 ? 'warning' : 'neutral'}>{s.count}</Chip>
              <span className="t-caption">{s.action}</span>
            </li>
          ))}
        </ol>
      </Card>

      <div className="edo__two edo__two--wide">
        <Card>
          <Tabs
            label={te('control.tabs')}
            value={tab}
            onChange={(k) => setTab(k as Tab)}
            items={TABS.map((k) => ({ key: k, label: te(`control.tab.${k}` as EdoKey) }))}
          />
          {rows.length === 0 ? (
            <EmptyState icon={CheckCircle2} tone="success" title={te('control.empty')} />
          ) : (
            <div className="ctable" role="table" aria-label={te('control.title')}>
              <div className="ctable__head" role="row">
                {(['title', 'from', 'due', 'left', 'status', 'actions'] as const).map((c) => (
                  <span key={c} role="columnheader" className="t-overline">
                    {te(`control.col.${c}` as EdoKey)}
                  </span>
                ))}
              </div>
              {rows.map((r) => (
                <div key={r.id} className="ctable__row" role="row">
                  <span role="cell" className="ctable__title">
                    <span className="list__title">{r.title}</span>
                    <span className="t-caption">{r.sub}</span>
                  </span>
                  <span role="cell" data-label={te('control.col.from')}>
                    {r.from}
                  </span>
                  <span role="cell" data-label={te('control.col.due')} className="mono">
                    {formatDate(new Date(r.due))} {formatTime(new Date(r.due))}
                  </span>
                  <span role="cell" data-label={te('control.col.left')}>
                    {leftLabel(r.due, now)}
                  </span>
                  <span role="cell">
                    <Chip tone={TONE[r.status]}>{te(`control.status.${r.status}` as EdoKey)}</Chip>
                  </span>
                  <span role="cell">
                    <Button variant="secondary" disabled title={te('soon')}>
                      {te('control.extend')}
                    </Button>
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <div className="stack">
          <Card title={te('control.reco')}>
            {reco.length === 0 ? (
              <p>{te('control.recoNone')}</p>
            ) : (
              <>
                <ol className="edo__bullets">
                  {reco.map((r) => (
                    <li key={r.id}>
                      <strong>{r.title}</strong> — {r.sub} ({leftLabel(r.due, now)})
                    </li>
                  ))}
                </ol>
                <p className="t-caption">{te('control.recoNote')}</p>
                <Button variant="primary" onClick={addToPlan}>
                  {te('control.recoAdd')}
                </Button>
              </>
            )}
          </Card>
          <Card title={te('control.appeal')}>
            <div className="appeal">
              <span className="appeal__n">{appealLeft}</span>
              <span className="t-caption">{te('control.appealLeft')}</span>
            </div>
            <p className="t-caption">
              {te('control.appealMeta', {
                n: control.appeal.number,
                who: control.appeal.applicant,
              })}
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
