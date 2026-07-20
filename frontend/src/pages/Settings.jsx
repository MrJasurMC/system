import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { AccountsService } from '../services/AccountsService';
import { AuthService } from '../services/AuthService';
import { getErrorMessage } from '../utils/errors';
import { ErrorState } from '../components/ui/ErrorState';
import { SystemWindow } from '../components/SystemWindow';
import { api } from '../api/client';
import { useCharacter, CHARACTER_QUERY_KEY } from '../hooks/useCharacter';
import { TIMEZONE_PRESETS } from '../constants/timezones';
export function Settings() {
  const {
    user,
    logout,
    deleteAccount
  } = useAuth();
  const nav = useNavigate();
  const queryClient = useQueryClient();
  const {
    data: char
  } = useCharacter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [tzBusy, setTzBusy] = useState(false);
  const [tzError, setTzError] = useState('');
  async function onTimezoneChange(timezone) {
    setTzBusy(true);
    setTzError('');
    try {
      await api.patch(`/characters/${char.id}/timezone`, {
        timezone
      });
      await queryClient.invalidateQueries({
        queryKey: CHARACTER_QUERY_KEY
      });
    } catch (err) {
      setTzError(getErrorMessage(err, 'Could not update your region.'));
    } finally {
      setTzBusy(false);
    }
  }
  const [resetConfirming, setResetConfirming] = useState(false);
  const [resetBusy, setResetBusy] = useState(false);
  const [resetError, setResetError] = useState('');
  const knownAccounts = AccountsService.list().filter(a => a.id !== user?.id);
  async function onDelete() {
    setBusy(true);
    setError('');
    try {
      await deleteAccount();
      nav('/welcome');
    } catch (err) {
      setError(getErrorMessage(err, 'Could not delete your account.'));
      setBusy(false);
    }
  }
  async function onReset() {
    setResetBusy(true);
    setResetError('');
    try {
      await AuthService.resetProgress();
      // Wipe every cached query (character, quests, inventory, etc.) so
      // nothing stale lingers, then send the player through character
      // creation again — the account/login itself is untouched.
      queryClient.clear();
      nav('/create-character');
    } catch (err) {
      setResetError(getErrorMessage(err, 'Could not reset your progress.'));
      setResetBusy(false);
    }
  }
  return <>
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
      </div>

      <SystemWindow title="Account">
        <div className="list-row">
          <div>
            <div style={{
            fontWeight: 600,
            fontSize: 14
          }}>{user?.username}</div>
            <div style={{
            fontSize: 12,
            color: 'var(--text-dim)'
          }}>{user?.email}</div>
          </div>
          <button className="btn ghost" onClick={() => logout()}>Log out</button>
        </div>
      </SystemWindow>

      {knownAccounts.length > 0 && <SystemWindow title="Other Local Accounts" style={{
      marginTop: 16
    }}>
          {knownAccounts.map(a => <div key={a.id} className="list-row">
              <div>
                <div style={{
            fontWeight: 600,
            fontSize: 14
          }}>{a.username}</div>
                <div style={{
            fontSize: 12,
            color: 'var(--text-dim)'
          }}>{a.email}</div>
              </div>
              <button className="btn ghost" onClick={async () => {
          await logout();
          nav('/login', {
            state: {
              prefillEmail: a.email
            }
          });
        }}>
                Switch
              </button>
            </div>)}
        </SystemWindow>}

      <SystemWindow title="Region" style={{
      marginTop: 16
    }}>
        <p style={{
        fontSize: 13,
        color: 'var(--text-dim)',
        marginBottom: 12
      }}>
          Main and Side quests reset at 5:00 AM in this timezone.
        </p>
        {tzError && <ErrorState message={tzError} />}
        <select className="input" value={char?.timezone ?? 'Asia/Tashkent'} disabled={tzBusy || !char} onChange={e => onTimezoneChange(e.target.value)}>
          {TIMEZONE_PRESETS.map(tz => <option key={tz.value} value={tz.value}>{tz.label}</option>)}
        </select>
      </SystemWindow>

      <SystemWindow title="New Game" style={{
      marginTop: 16,
      borderColor: 'rgba(220,160,50,0.3)'
    }}>
        {resetError && <ErrorState message={resetError} />}
        {!resetConfirming ? <div>
            <p style={{
          fontSize: 13,
          color: 'var(--text-dim)',
          marginBottom: 12
        }}>
              Wipes your character, level, gold, quests, inventory, and achievements and starts you
              fresh — like a new account. Your login (username, email, password) stays exactly as is.
            </p>
            <button className="btn ghost" onClick={() => setResetConfirming(true)}>
              Reset Everything
            </button>
          </div> : <div>
            <p style={{
          fontSize: 13,
          color: 'var(--text-dim)',
          marginBottom: 12
        }}>
              This cannot be undone. Your character, level, gold, quests, inventory, and achievements
              will all be gone. You'll keep your login and start over from Level 1.
            </p>
            <div style={{
          display: 'flex',
          gap: 8
        }}>
              <button className="btn danger" disabled={resetBusy} onClick={onReset}>
                {resetBusy ? 'Resetting...' : 'Yes, reset everything'}
              </button>
              <button className="btn ghost" disabled={resetBusy} onClick={() => setResetConfirming(false)}>
                Cancel
              </button>
            </div>
          </div>}
      </SystemWindow>

      <SystemWindow title="Danger Zone" style={{
      marginTop: 16,
      borderColor: 'rgba(220,50,50,0.3)'
    }}>
        {error && <ErrorState message={error} />}
        {!confirming ? <button className="btn danger" onClick={() => setConfirming(true)}>
            Delete Account
          </button> : <div>
            <p style={{
          fontSize: 13,
          color: 'var(--text-dim)',
          marginBottom: 12
        }}>
              This permanently deletes your character, progress, and achievements. This cannot be undone.
            </p>
            <div style={{
          display: 'flex',
          gap: 8
        }}>
              <button className="btn danger" disabled={busy} onClick={onDelete}>
                {busy ? 'Deleting...' : 'Yes, delete everything'}
              </button>
              <button className="btn ghost" disabled={busy} onClick={() => setConfirming(false)}>
                Cancel
              </button>
            </div>
          </div>}
      </SystemWindow>
    </>;
}