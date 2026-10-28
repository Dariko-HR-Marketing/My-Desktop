import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { LayoutGrid, MessageCircle, ShieldCheck } from 'lucide-react';
import { Banner, Button, Tabs } from '../../components';
import { ApiError, NetworkError } from '../../lib/api';
import { APP_VERSION } from '../../lib/config';
import { t, tf } from '../../lib/i18n';
import { useSession } from '../../state/session';
import { enterDemo, login } from './auth';
import './auth.css';

type Method = 'eimzo' | 'password';

export function LoginPage() {
  const status = useSession((s) => s.status);
  const navigate = useNavigate();
  const from = (useLocation().state as { from?: string } | null)?.from ?? '/';
  const [method, setMethod] = useState<Method>('password');
  const [loginName, setLoginName] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ login?: string; password?: string; form?: string }>({});
  const [network, setNetwork] = useState(false);
  const [busy, setBusy] = useState(false);
  const loginRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  // Focus the first field with an error once it has rendered.
  useEffect(() => {
    if (errors.login) loginRef.current?.focus();
    else if (errors.password || errors.form) passwordRef.current?.focus();
  }, [errors]);

  if (status === 'authed') return <Navigate to={from} replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};
    if (!loginName.trim()) next.login = t('login.errLogin');
    if (!password) next.password = t('login.errPassword');
    setErrors(next);
    setNetwork(false);
    if (next.login || next.password) return;

    setBusy(true);
    try {
      await login(loginName.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      if (err instanceof NetworkError) {
        setNetwork(true);
        setErrors({ form: t('login.errNetwork') });
      } else if (err instanceof ApiError && err.status === 429)
        setErrors({ form: t('login.errRate') });
      else if (err instanceof ApiError && err.status === 401) setErrors({ form: err.message });
      else setErrors({ form: t('login.errServer') });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login">
      <aside className="login__pitch" aria-hidden="false">
        <div className="login__brand">
          <div className="sidebar__logo">IM</div>
          <span>{t('app.name')}</span>
        </div>
        <h2 className="login__pitch-title">{t('login.lead')}</h2>
        <ul className="login__pitch-list">
          <li>
            <LayoutGrid size={20} strokeWidth={1.8} aria-hidden="true" />
            {t('login.pitch1')}
          </li>
          <li>
            <ShieldCheck size={20} strokeWidth={1.8} aria-hidden="true" />
            {t('login.pitch2')}
          </li>
          <li>
            <MessageCircle size={20} strokeWidth={1.8} aria-hidden="true" />
            {t('login.pitch3')}
          </li>
        </ul>
      </aside>

      <main className="login__panel" id="content">
        <div className="login__card">
          <h1 className="t-title">{t('login.heading')}</h1>
          <Tabs
            label={t('login.tabs')}
            value={method}
            onChange={(k) => setMethod(k as Method)}
            items={[
              { key: 'eimzo', label: t('login.tab.eimzo') },
              { key: 'password', label: t('login.tab.password') },
            ]}
          />

          {method === 'eimzo' ? (
            <div className="login__soon" role="tabpanel">
              <Banner>{t('login.eimzoSoon')}</Banner>
            </div>
          ) : (
            <form onSubmit={onSubmit} noValidate role="tabpanel" className="login__form">
              <div className="field">
                <label htmlFor="login">{t('login.login')}</label>
                <input
                  id="login"
                  ref={loginRef}
                  className="input"
                  autoComplete="username"
                  autoCapitalize="none"
                  value={loginName}
                  onChange={(e) => setLoginName(e.target.value)}
                  aria-invalid={!!errors.login}
                  aria-describedby={errors.login ? 'login-err' : undefined}
                />
                {errors.login && (
                  <p id="login-err" className="field__error">
                    {errors.login}
                  </p>
                )}
              </div>
              <div className="field">
                <label htmlFor="password">{t('login.password')}</label>
                <input
                  id="password"
                  ref={passwordRef}
                  className="input"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={!!(errors.password || errors.form)}
                  aria-describedby={errors.password || errors.form ? 'password-err' : undefined}
                />
                {(errors.password || errors.form) && (
                  <p id="password-err" className="field__error" role="alert">
                    {errors.password ?? errors.form}
                  </p>
                )}
              </div>
              <Button type="submit" variant="primary" className="login__submit" disabled={busy}>
                {busy ? t('login.submitting') : t('login.submit')}
              </Button>
              {network && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    enterDemo();
                    navigate(from, { replace: true });
                  }}
                >
                  {t('login.demo')}
                </Button>
              )}
            </form>
          )}

          <p className="t-caption login__note">{t('login.qr')}</p>
          <p className="t-caption login__note">{t('login.secure')}</p>
        </div>
        <footer className="login__foot t-caption">
          <span>{t('login.help')}</span>
          <span>{tf('login.version', { v: APP_VERSION })}</span>
        </footer>
      </main>
    </div>
  );
}
