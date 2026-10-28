import { Card } from '../../components';
import { t, type MessageKey } from '../../lib/i18n';
import type { Density, Theme } from '../../lib/layout';
import { useUi } from '../../state/ui';

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: MessageKey }[];
  onChange(v: T): void;
}) {
  return (
    <div role="group" aria-label={label} className="segmented">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
        >
          {t(o.label)}
        </button>
      ))}
    </div>
  );
}

export function SettingsPage() {
  const { theme, density, setTheme, setDensity } = useUi();
  return (
    <>
      <div className="page__head">
        <h1 className="t-display">{t('settings.title')}</h1>
      </div>
      <Card title={t('settings.appearance')}>
        <div className="stack">
          <div className="stack" style={{ gap: 'var(--space-2)' }}>
            <span className="t-caption">{t('settings.theme')}</span>
            <Segmented<Theme>
              label={t('settings.theme')}
              value={theme}
              onChange={setTheme}
              options={[
                { value: 'light', label: 'settings.theme.light' },
                { value: 'dark', label: 'settings.theme.dark' },
                { value: 'system', label: 'settings.theme.system' },
              ]}
            />
          </div>
          <div className="stack" style={{ gap: 'var(--space-2)' }}>
            <span className="t-caption">{t('settings.density')}</span>
            <Segmented<Density>
              label={t('settings.density')}
              value={density}
              onChange={setDensity}
              options={[
                { value: 'comfortable', label: 'settings.density.comfortable' },
                { value: 'compact', label: 'settings.density.compact' },
              ]}
            />
            <span className="t-caption">{t('settings.densityNote')}</span>
          </div>
        </div>
      </Card>
    </>
  );
}
