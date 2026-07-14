import { FormEvent, useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AccountsService } from '../services/AccountsService';
import { getErrorMessage } from '../utils/errors';
import { ErrorState } from '../components/ui/ErrorState';
import { SystemWindow } from '../components/SystemWindow';

export function Login() {
  const { login, user } = useAuth();
  const nav = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [knownAccounts, setKnownAccounts] = useState(() => AccountsService.list());

  function forgetAccount(id: string) {
    AccountsService.forget(id);
    setKnownAccounts(AccountsService.list());
  }

  useEffect(() => {
    const prefill = (location.state as { prefillEmail?: string } | null)?.prefillEmail;
    if (prefill) setEmail(prefill);
  }, [location.state]);

  if (user) return <Navigate to="/" replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(email, password);
      nav('/');
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Invalid email or password.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-title">SYSTEM</div>
        <div className="auth-sub">// AUTHENTICATE TO CONTINUE</div>

        {knownAccounts.length > 0 && (
          <SystemWindow title="Continue As" style={{ marginBottom: 16 }}>
            {knownAccounts.map((a) => (
              <div key={a.id} className="list-row" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => setEmail(a.email)}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{a.username}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{a.email}</div>
                </div>
                <span className="badge" style={{ cursor: 'pointer' }} onClick={() => setEmail(a.email)}>select</span>
                <span
                  className="badge"
                  title="Remove from this list"
                  style={{ cursor: 'pointer', color: 'var(--danger)' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    forgetAccount(a.id);
                  }}
                >
                  ✕
                </span>
              </div>
            ))}
          </SystemWindow>
        )}

        <SystemWindow title="Login">
          <form onSubmit={onSubmit}>
            <div className="field">
              <label>Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="field">
              <label>Password</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            {error && <ErrorState message={error} />}
            <button className="btn" type="submit" disabled={busy} style={{ width: '100%' }}>
              {busy ? 'Authenticating...' : 'Enter'}
            </button>
          </form>
        </SystemWindow>
        <div style={{ textAlign: 'center', marginTop: 16, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-dim)' }}>
          No account yet? <Link to="/create-character" style={{ color: 'var(--accent-soft)' }}>Create one</Link>
        </div>
      </div>
    </div>
  );
}
