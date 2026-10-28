// Dev-only gallery of the design-system components (route /dev/ui, not shipped in production builds).
import { useState } from 'react';
import { Bell, CheckCircle2, Plus } from 'lucide-react';
import {
  Badge,
  Banner,
  Button,
  Card,
  Chip,
  Drawer,
  EmptyState,
  IconButton,
  Kpi,
  Skeleton,
  Switch,
  Tabs,
  Tooltip,
} from '../components';

export function UiKitPage() {
  const [on, setOn] = useState(true);
  const [tab, setTab] = useState('all');
  const [open, setOpen] = useState(false);
  return (
    <div className="stack">
      <h1 className="t-display">UI kit</h1>
      <Banner offline action={<Button variant="secondary">Qayta urinish</Button>}>
        Internet yoʻq. 09:12 holatidagi maʼlumot koʻrsatilmoqda
      </Banner>
      <div className="grid-kpi">
        <Kpi label="Bugungi vazifalar" value="1 / 5" progress={20} tone="success" />
        <Kpi label="Muddati oʻtgan" value="2" tone="danger" hint="Ijro nazorati →" />
        <Kpi label="Imzo kutmoqda" value="4" tone="info" hint="Hujjat aylanishi modulidan" />
      </div>
      <Card title="Tugmalar va yorliqlar" action={<a href="#kit">Hammasi →</a>}>
        <div className="row">
          <Button variant="primary" icon={Plus}>
            Yangi vazifa
          </Button>
          <Button>Ikkinchi darajali</Button>
          <Button variant="ghost">Matnli</Button>
          <Button variant="danger-ghost">Oʻchirish</Button>
          <Button disabled>Oʻchirilgan</Button>
          <IconButton label="Bildirishnomalar" icon={Bell} badge={3} />
          <Tooltip content="Maslahat" side="bottom">
            <IconButton label="Qoʻshish" icon={Plus} />
          </Tooltip>
          <Badge count={7} /> <Badge count={120} tone="danger" />
          <Chip tone="danger">Kechikkan</Chip> <Chip tone="warning">Bugun</Chip>{' '}
          <Chip tone="success">Bajarildi</Chip> <Chip tone="info">Jarayonda</Chip>{' '}
          <Chip>Oddiy</Chip>
          <Switch checked={on} onChange={setOn} label="Yoqish" />
          <Button onClick={() => setOpen(true)}>Panelni ochish</Button>
        </div>
      </Card>
      <Card title="Yorliqlar">
        <Tabs
          label="Namuna"
          value={tab}
          onChange={setTab}
          items={[
            { key: 'all', label: 'Hammasi', count: 6 },
            { key: 'work', label: 'Ish', count: 3 },
            { key: 'sys', label: 'Tizim' },
          ]}
        />
      </Card>
      <Card title="Yuklanish" aria-busy>
        <div className="stack" style={{ gap: 'var(--space-3)' }}>
          <Skeleton width="60%" /> <Skeleton width="90%" /> <Skeleton height={48} radius={10} />
        </div>
      </Card>
      <Card>
        <EmptyState
          icon={CheckCircle2}
          tone="success"
          title="Bugun hamma ishlar bajarildi"
          description="Yangi vazifa qoʻshing yoki ertangi rejaga qarang."
          actions={<Button variant="primary">Yangi vazifa</Button>}
        />
      </Card>
      <Drawer open={open} onClose={() => setOpen(false)} title="Bildirishnomalar">
        <p>Panel mazmuni.</p>
        <Button>Amal</Button>
      </Drawer>
    </div>
  );
}
