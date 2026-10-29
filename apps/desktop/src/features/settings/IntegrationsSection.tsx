import { useCallback, useEffect, useState } from 'react';
import { ExternalLink, KeyRound, Plug, TriangleAlert } from 'lucide-react';
import {
  providerByKey,
  type IntegrationProvider,
  type IntegrationStatus,
  type IntegrationTestResult,
} from '@ish-maydoni/shared';
import { Banner, Button, Chip, Drawer, EmptyState, Skeleton } from '../../components';
import { ApiError, NetworkError } from '../../lib/api';
import { api } from '../../lib/client';
import { t, tf, type MessageKey } from '../../lib/i18n';
import {
  canEdit,
  connectionState,
  groupProviders,
  initialForm,
  missingFields,
  payloadFor,
} from '../../lib/integrations';
import { useSession } from '../../state/session';
import { useToast } from '../../state/toast';

interface Loaded {
  enabled: boolean;
  providers: IntegrationProvider[];
  statuses: Record<string, IntegrationStatus>;
}

type Load =
  { state: 'loading' } | { state: 'error'; offline: boolean } | { state: 'ready'; data: Loaded };

const STATE_CHIP = {
  none: { tone: 'neutral', label: 'integ.state.none' },
  saved: { tone: 'info', label: 'integ.state.saved' },
  ok: { tone: 'success', label: 'integ.state.ok' },
  failed: { tone: 'danger', label: 'integ.state.failed' },
} as const;

const errorText = (e: unknown) =>
  e instanceof ApiError
    ? e.message
    : e instanceof NetworkError
      ? t('integ.offline')
      : t('state.errorText');

function EditForm({
  provider,
  status,
  onClose,
  onChange,
}: {
  provider: IntegrationProvider;
  status: IntegrationStatus | undefined;
  onClose(): void;
  onChange(s: IntegrationStatus): void;
}) {
  const [form, setForm] = useState(() => initialForm(provider, status));
  const [busy, setBusy] = useState<'save' | 'test' | 'remove' | null>(null);
  const [error, setError] = useState('');
  const [result, setResult] = useState<IntegrationTestResult | null>(null);
  const [tried, setTried] = useState(false);
  const connected = !!status?.connected;
  const missing = missingFields(provider, form, status);
  const path = `/api/integrations/${provider.key}`;

  async function save(): Promise<IntegrationStatus | null> {
    setTried(true);
    setError('');
    if (missing.length > 0) return null;
    setBusy('save');
    try {
      const saved = await api.put<IntegrationStatus>(path, { fields: payloadFor(provider, form) });
      onChange(saved);
      // secrets are never echoed back: clear the typed value, the hint shows what is stored
      setForm(initialForm(provider, saved));
      return saved;
    } catch (e) {
      setError(errorText(e));
      return null;
    } finally {
      setBusy(null);
    }
  }

  async function saveAndTest() {
    const saved = await save();
    if (!saved) return;
    setBusy('test');
    try {
      const r = await api.post<IntegrationTestResult>(`${path}/test`);
      setResult(r);
      onChange(r.status);
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(null);
    }
  }

  async function remove() {
    setBusy('remove');
    setError('');
    try {
      await api.delete(path);
      onChange({
        key: provider.key,
        connected: false,
        fields: [],
        updatedAt: null,
        lastTest: null,
      });
      useToast.getState().push(tf('integ.removed', { name: provider.name }));
      onClose();
    } catch (e) {
      setError(errorText(e));
      setBusy(null);
    }
  }

  return (
    <form
      className="stack"
      onSubmit={(e) => {
        e.preventDefault();
        void saveAndTest();
      }}
    >
      <p>{provider.description}</p>
      <p className="t-caption">
        {provider.scope === 'org' ? t('integ.scope.org') : t('integ.scope.user')} ·{' '}
        <a href={provider.docsUrl} target="_blank" rel="noreferrer noopener">
          {t('integ.docs')} <ExternalLink size={12} aria-hidden="true" />
        </a>
      </p>
      {provider.fields.map((f) => {
        const id = `integ-${provider.key}-${f.key}`;
        const stored = status?.fields.find((x) => x.key === f.key);
        const invalid = tried && missing.includes(f.key);
        return (
          <div key={f.key} className="stack" style={{ gap: 'var(--space-1)' }}>
            <label htmlFor={id} className="t-section">
              {f.label}
              {f.required ? ' *' : ''}
            </label>
            <input
              id={id}
              className="input"
              type={f.secret ? 'password' : 'text'}
              autoComplete="off"
              spellCheck={false}
              value={form[f.key] ?? ''}
              placeholder={f.secret && stored?.set ? stored.hint : f.placeholder}
              aria-invalid={invalid || undefined}
              aria-describedby={`${id}-note`}
              inputMode={f.url ? 'url' : undefined}
              onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
            />
            <span id={`${id}-note`} className={invalid ? 't-caption integ__bad' : 't-caption'}>
              {invalid
                ? t('integ.required')
                : f.secret && stored?.set
                  ? tf('integ.keepSecret', { hint: stored.hint })
                  : (f.help ?? '')}
            </span>
          </div>
        );
      })}

      {error && <Banner tone="danger">{error}</Banner>}
      {result && (
        <div className="row" role="status">
          <Chip tone={result.ok ? 'success' : 'danger'}>
            {t(result.ok ? 'integ.state.ok' : 'integ.state.failed')}
          </Chip>
          <span>{result.message}</span>
        </div>
      )}

      <div className="row">
        <Button variant="primary" type="submit" icon={KeyRound} disabled={busy !== null}>
          {busy === 'save' || busy === 'test'
            ? t('common.loading')
            : provider.test
              ? t('integ.saveTest')
              : t('integ.save')}
        </Button>
        {connected && (
          <Button variant="danger-ghost" onClick={() => void remove()} disabled={busy !== null}>
            {t('integ.remove')}
          </Button>
        )}
      </div>
    </form>
  );
}

export function IntegrationsSection() {
  const role = useSession((s) => s.user?.role);
  const [load, setLoad] = useState<Load>({ state: 'loading' });
  const [editing, setEditing] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoad({ state: 'loading' });
    try {
      const [catalog, list] = await Promise.all([
        api.get<{ enabled: boolean; items: IntegrationProvider[] }>('/api/integrations/providers'),
        api.get<{ items: IntegrationStatus[] }>('/api/integrations'),
      ]);
      setLoad({
        state: 'ready',
        data: {
          enabled: catalog.enabled,
          providers: catalog.items,
          statuses: Object.fromEntries(list.items.map((s) => [s.key, s])),
        },
      });
    } catch (e) {
      setLoad({ state: 'error', offline: e instanceof NetworkError });
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (load.state === 'loading') {
    return (
      <div className="stack" aria-busy="true">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} height={52} radius={10} />
        ))}
      </div>
    );
  }
  if (load.state === 'error') {
    return (
      <EmptyState
        icon={TriangleAlert}
        title={t(load.offline ? 'integ.offline' : 'state.error')}
        description={t('state.errorText')}
        actions={<Button onClick={() => void refresh()}>{t('common.retry')}</Button>}
      />
    );
  }

  const { data } = load;
  const groups = groupProviders(data.providers);
  const current = editing ? providerByKey(editing) : undefined;

  if (groups.length === 0) {
    return <EmptyState icon={Plug} title={t('integ.empty')} />;
  }

  return (
    <div className="stack">
      {!data.enabled && (
        <Banner>{role === 'ADMIN' ? t('integ.disabledAdmin') : t('integ.disabled')}</Banner>
      )}
      <p className="t-caption">{t('integ.intro')}</p>
      {groups.map((g) => (
        <section key={g.category} className="stack" aria-labelledby={`integ-cat-${g.category}`}>
          <h3 id={`integ-cat-${g.category}`} className="t-overline">
            {t(`integ.cat.${g.category}` as MessageKey)}
          </h3>
          <ul className="list">
            {g.items.map((p) => {
              const status = data.statuses[p.key];
              const chip = STATE_CHIP[connectionState(status)];
              const editable = canEdit(p, role) && data.enabled;
              return (
                <li key={p.key} className="list__row">
                  <span className="list__main">
                    <span className="list__title">{p.name}</span>
                    <span className="t-caption">
                      {p.scope === 'org' ? t('integ.scope.org') : t('integ.scope.user')}
                    </span>
                  </span>
                  <Chip tone={chip.tone}>{t(chip.label)}</Chip>
                  {editable ? (
                    <Button
                      onClick={() => setEditing(p.key)}
                      aria-label={tf('integ.configure', { name: p.name })}
                    >
                      {status?.connected ? t('integ.edit') : t('integ.connect')}
                    </Button>
                  ) : (
                    <span className="t-caption">
                      {canEdit(p, role) ? '' : t('integ.adminOnly')}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      <Drawer
        open={!!current}
        onClose={() => setEditing(null)}
        title={current ? current.name : t('integ.title')}
      >
        {current && (
          <EditForm
            key={current.key}
            provider={current}
            status={data.statuses[current.key]}
            onClose={() => setEditing(null)}
            onChange={(s) =>
              setLoad((l) =>
                l.state === 'ready'
                  ? {
                      state: 'ready',
                      data: { ...l.data, statuses: { ...l.data.statuses, [s.key]: s } },
                    }
                  : l,
              )
            }
          />
        )}
      </Drawer>
    </div>
  );
}
