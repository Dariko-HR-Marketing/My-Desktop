import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Lock, ServerCrash } from 'lucide-react';
import { Banner, Button, Card, EmptyState, Skeleton, Tabs } from '../../../components';
import { useSession } from '../../../state/session';
import { useToast } from '../../../state/toast';
import { Assignments } from './Assignments';
import { Control } from './Control';
import { Documents } from './Documents';
import { Overview } from './Overview';
import { Reports } from './Reports';
import { signDocs } from './edoLogic';
import { te } from './messages';
import { useEdo } from './store';
import './edo.css';

const TABS = ['overview', 'documents', 'control', 'assignments', 'reports'] as const;
type TabKey = (typeof TABS)[number];

const pathFor = (k: TabKey) => (k === 'overview' ? '/m/edo' : `/m/edo/${k}`);

/** The document-workflow module: its own header, tabs and screens; talks to the core only through the manifest. */
export default function EdoModule() {
  const params = useParams();
  const navigate = useNavigate();
  const { status, data, error } = useEdo();
  const demo = useSession((s) => s.demo);
  const sub = (params['*'] ?? '').split('/')[0] ?? '';
  const tab: TabKey = (TABS.find((k) => k === sub) ?? 'overview') as TabKey;

  useEffect(() => {
    void useEdo.getState().load();
  }, []);

  const counts = data
    ? {
        documents: signDocs(data.documents).length,
        control: data.control.counters.overdue,
        assignments: data.assignments.filter((a) => a.column !== 'DONE').length,
      }
    : null;

  return (
    <div className="edo">
      <header className="edo__head">
        <div>
          <h1 className="t-display">{te('title')}</h1>
          <p className="t-caption">{te('lead')}</p>
        </div>
        <div className="row">
          <Button disabled title={te('soon')}>
            {te('templates')}
          </Button>
          <Button variant="primary" disabled title={te('soon')}>
            + {te('newDocument')}
          </Button>
        </div>
      </header>

      <Tabs
        label={te('tabs')}
        value={tab}
        onChange={(k) => navigate(pathFor(k as TabKey))}
        items={TABS.map((k) => ({
          key: k,
          label: te(`tab.${k}` as 'tab.overview'),
          count: counts && k in counts ? counts[k as keyof typeof counts] : undefined,
        }))}
      />

      {(demo || data) && <Banner>{te('demoNote')}</Banner>}
      {error === 'network' && data && <Banner offline>{te('loadError')}</Banner>}

      <div role="tabpanel" aria-busy={status === 'loading'}>
        {status === 'loading' && (
          <div className="stack" aria-label="loading">
            <Skeleton height={96} radius={12} /> <Skeleton height={220} radius={12} />
          </div>
        )}
        {status === 'error' && error === 'forbidden' && (
          <Card>
            <EmptyState
              icon={Lock}
              title={te('denied')}
              description={te('deniedText')}
              actions={
                <Button
                  variant="primary"
                  onClick={() => useToast.getState().push(te('askAdminToast'))}
                >
                  {te('askAdmin')}
                </Button>
              }
            />
          </Card>
        )}
        {status === 'error' && error !== 'forbidden' && (
          <Card>
            <EmptyState
              icon={ServerCrash}
              title={te('loadError')}
              description={te('loadErrorText')}
              actions={<Button onClick={() => void useEdo.getState().load()}>{te('retry')}</Button>}
            />
          </Card>
        )}
        {data && status === 'ready' && (
          <>
            {tab === 'overview' && <Overview data={data} />}
            {tab === 'documents' && <Documents data={data} />}
            {tab === 'control' && <Control data={data} />}
            {tab === 'assignments' && <Assignments data={data} />}
            {tab === 'reports' && <Reports />}
          </>
        )}
      </div>
    </div>
  );
}
