import { Link } from 'react-router-dom';
import { FilePlus2, Globe, Plus } from 'lucide-react';
import { Card, Kpi, Skeleton } from '../../components';
import { formatDate, formatTime } from '../../lib/format';
import { greeting, resolveActionUrl, summarySentence } from '../../lib/home';
import { t } from '../../lib/i18n';
import {
  nextMeeting,
  SAMPLE_ARRIVAL,
  SAMPLE_MEETINGS,
  SAMPLE_PLAN_PERCENT,
} from '../../lib/sample';
import { useNow } from '../../lib/useNow';
import { selectStats, useData } from '../../state/data';
import { useSession } from '../../state/session';
import {
  AttentionCard,
  MessagesCard,
  SampleMarker,
  ScheduleCard,
  TodayTasksCard,
  WidgetsCard,
} from './blocks';
import './home.css';

const WEEKDAYS = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];

export function HomePage() {
  const now = useNow();
  const user = useSession((s) => s.user);
  const tasks = useData((s) => s.tasks);
  const dashboard = useData((s) => s.dashboard);
  const stats = selectStats({ tasks, dashboard }, now);
  const meeting = nextMeeting(SAMPLE_MEETINGS, formatTime(now));
  const signature = dashboard.data?.signals.find((s) => s.label === 'Imzo kutmoqda');
  const loading = !stats && (tasks.status === 'loading' || tasks.status === 'idle');
  const progress = stats && stats.today > 0 ? Math.round((stats.todayDone / stats.today) * 100) : 0;

  return (
    <div className="home">
      <header className="home__head">
        <div>
          <div className="t-caption">
            {WEEKDAYS[now.getDay()]}, {formatDate(now)} {now.getFullYear()}
          </div>
          <h1 className="t-display">{greeting(now.getHours(), user?.fullName)}</h1>
          <p className="home__summary" aria-live="polite">
            {stats ? summarySentence(stats, meeting?.time) : <Skeleton width={320} />}
          </p>
        </div>
        <div className="row">
          <Link to="/tasks" className="btn btn--primary">
            <Plus size={18} strokeWidth={1.8} aria-hidden="true" />
            {t('home.quick.newTask')}
          </Link>
          <Link to="/browser" className="btn btn--secondary">
            <Globe size={18} strokeWidth={1.8} aria-hidden="true" />
            {t('home.quick.browser')}
          </Link>
          <Link to="/m/edo" className="btn btn--secondary">
            <FilePlus2 size={18} strokeWidth={1.8} aria-hidden="true" />
            {t('home.quick.document')}
          </Link>
        </div>
      </header>

      {loading ? (
        <div className="grid-kpi" aria-busy="true">
          {Array.from({ length: 5 }, (_, i) => (
            <Card key={i}>
              <Skeleton width="60%" />
              <div style={{ height: 12 }} />
              <Skeleton width="40%" height={28} />
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid-kpi">
          <Kpi
            label={t('home.kpi.today')}
            value={stats ? `${stats.todayDone} / ${stats.today}` : '–'}
            progress={progress}
            tone="success"
          />
          <Link to="/m/edo/control" className="kpi-link">
            <Kpi
              label={t('home.kpi.overdue')}
              value={stats?.overdue ?? '–'}
              tone={stats?.overdue ? 'danger' : 'default'}
              hint={t('home.kpi.overdueHint')}
            />
          </Link>
          <Link to={signature ? resolveActionUrl(signature.url).to : '/m/edo'} className="kpi-link">
            <Kpi
              label={t('home.kpi.signature')}
              value={signature?.count ?? '–'}
              tone="info"
              hint={t('home.kpi.signatureHint')}
            />
          </Link>
          <Kpi
            label={t('home.kpi.plan')}
            value={`${SAMPLE_PLAN_PERCENT}%`}
            progress={SAMPLE_PLAN_PERCENT}
            hint={<SampleMarker />}
          />
          <Kpi
            label={t('home.kpi.arrival')}
            value={<span className="mono">{SAMPLE_ARRIVAL}</span>}
            tone="success"
            hint={
              <>
                <span>{t('home.kpi.onTime')}</span> <SampleMarker />
              </>
            }
          />
        </div>
      )}

      <div className="home__cols">
        <div className="stack">
          <AttentionCard tasks={tasks} now={now} />
          <TodayTasksCard tasks={tasks} now={now} />
        </div>
        <div className="stack">
          <MessagesCard />
          <ScheduleCard />
          <WidgetsCard />
        </div>
      </div>
    </div>
  );
}
