import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { ValidationService } from '../services/ValidationService';
import { getErrorMessage } from '../utils/errors';
import { ErrorState } from '../components/ui/ErrorState';
import { SystemWindow } from '../components/SystemWindow';
const CLASSES = [{
  value: 'warrior',
  label: 'Warrior'
}, {
  value: 'ranger',
  label: 'Ranger'
}, {
  value: 'mage',
  label: 'Mage'
}, {
  value: 'monk',
  label: 'Monk'
}, {
  value: 'assassin',
  label: 'Assassin'
}, {
  value: 'berserker',
  label: 'Berserker'
}, {
  value: 'cleric',
  label: 'Cleric'
}, {
  value: 'paladin',
  label: 'Paladin'
}, {
  value: 'rogue',
  label: 'Rogue'
}, {
  value: 'wizard',
  label: 'Wizard'
}, {
  value: 'samurai',
  label: 'Samurai'
}, {
  value: 'lucky',
  label: 'Lucky'
}];
const ADJECTIVES = ['Shadow', 'Iron', 'Storm', 'Frost', 'Void', 'Blaze', 'Apex', 'Astral', 'Lucky', 'Rich', 'Poor', 'Average', 'Godly', 'Dumb', 'Smart'];
const NOUNS = ['Hunter', 'Blade', 'Wolf', 'Phantom', 'Knight', 'Seeker', 'Veil', 'Surge'];
const rand = arr => arr[Math.floor(Math.random() * arr.length)];
export function CharacterCreation() {
  const {
    register,
    user,
    loading: authLoading
  } = useAuth();
  const nav = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [characterName, setCharacterName] = useState('');
  const [characterClass, setCharacterClass] = useState('warrior');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [checkingExisting, setCheckingExisting] = useState(!!user);
  const [hasCharacter, setHasCharacter] = useState(false);
  useEffect(() => {
    if (!user) {
      setCheckingExisting(false);
      return;
    }
    let cancelled = false;
    api.get('/characters').then(() => {
      if (!cancelled) setHasCharacter(true);
    }).catch(() => {
      // 404 = logged in but no character yet — exactly who this page is for.
    }).finally(() => {
      if (!cancelled) setCheckingExisting(false);
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Wait for the initial session check before deciding which form to show,
  // so a page refresh with a valid session doesn't flash the "register a
  // new account" form for a split second before switching to the
  // "name your character" form.
  if (authLoading) return <span className="loading-line">LOADING...</span>;

  // Already logged in AND already has a character — nothing to do here.
  if (user && checkingExisting) return <span className="loading-line">LOADING...</span>;
  if (user && hasCharacter) return <Navigate to="/" replace />;
  async function onCreateForExistingUser(e) {
    e.preventDefault();
    setError('');
    if (characterName.trim().length < 2) {
      setError('Character name must be at least 2 characters.');
      return;
    }
    setBusy(true);
    try {
      await api.post('/characters', {
        name: characterName,
        class: characterClass
      });
      nav('/');
    } catch (err) {
      setError(getErrorMessage(err, 'Could not create your character.'));
    } finally {
      setBusy(false);
    }
  }

  // Logged in, confirmed no character yet: skip registration entirely and
  // just ask for name + class, then create it and go straight to the app.
  if (user) {
    return <div className="auth-shell" style={{
      background: '#020306'
    }}>
        <div className="auth-card">
          <div className="auth-title" style={{
          color: 'var(--accent)',
          textShadow: '0 0 10px var(--accent-soft)'
        }}>
            SYSTEM
          </div>
          <div className="auth-sub" style={{
          color: 'var(--text-dim)',
          letterSpacing: '0.2em'
        }}>
            // CREATE YOUR CHARACTER
          </div>
          <SystemWindow title="Integration Sequence">
            <form onSubmit={onCreateForExistingUser}>
              <div className="field">
                <label>Character Name</label>
                <input required minLength={2} maxLength={20} value={characterName} onChange={e => setCharacterName(e.target.value)} />
              </div>
              <div className="field">
                <label>Class</label>
                <select value={characterClass} onChange={e => setCharacterClass(e.target.value)}>
                  {CLASSES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              {error && <ErrorState message={error} />}
              <button className="btn" type="submit" disabled={busy} style={{
              width: '100%',
              marginTop: '10px'
            }}>
                {busy ? 'Creating...' : 'Begin'}
              </button>
            </form>
          </SystemWindow>
        </div>
      </div>;
  }
  function quickFill() {
    const adj = rand(ADJECTIVES);
    const noun = rand(NOUNS);
    const id = Math.floor(Math.random() * 9000) + 1000;
    const pw = `Test@${id}!`;
    setUsername(`${adj}${noun}${id}`);
    setEmail(`${adj.toLowerCase()}${noun.toLowerCase()}${id}@test.com`);
    setPassword(pw);
    setConfirmPassword(pw);
    setCharacterName(`${adj} ${noun}`);
    setCharacterClass(CLASSES[Math.floor(Math.random() * CLASSES.length)].value);
  }
  async function quickRegister() {
    const adj = rand(ADJECTIVES);
    const noun = rand(NOUNS);
    const id = Math.floor(Math.random() * 9000) + 1000;
    const pw = `Test@${id}!`;
    const u = `${adj}${noun}${id}`;
    const e = `${adj.toLowerCase()}${noun.toLowerCase()}${id}@test.com`;
    const cn = `${adj} ${noun}`;
    const cc = CLASSES[Math.floor(Math.random() * CLASSES.length)].value;
    setError('');
    setBusy(true);
    try {
      await register(u, e, pw);
      await api.post('/characters', {
        name: cn,
        class: cc
      });
      nav('/');
    } catch (err) {
      setError(getErrorMessage(err, 'Quick register failed.'));
    } finally {
      setBusy(false);
    }
  }
  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    const validationError = ValidationService.username(username) || ValidationService.email(email) || ValidationService.password(password) || ValidationService.confirmPassword(password, confirmPassword) || (characterName.trim().length < 2 ? 'Character name must be at least 2 characters.' : null);
    if (validationError) {
      setError(validationError);
      return;
    }
    setBusy(true);
    try {
      await register(username, email, password);
      await api.post('/characters', {
        name: characterName,
        class: characterClass
      });
      nav('/');
    } catch (err) {
      setError(getErrorMessage(err, 'Could not create your account.'));
    } finally {
      setBusy(false);
    }
  }
  return <div className="auth-shell" style={{
    background: '#020306'
  }}>
      <div className="auth-card">
        <div className="auth-title" style={{
        color: 'var(--accent)',
        textShadow: '0 0 10px var(--accent-soft)'
      }}>
          SYSTEM
        </div>
        <div className="auth-sub" style={{
        color: 'var(--text-dim)',
        letterSpacing: '0.2em'
      }}>
          // CREATE YOUR ACCOUNT
        </div>

        {/* One-click shortcut strip */}
        <div style={{
        display: 'flex',
        gap: 8,
        marginBottom: 12
      }}>
          <button type="button" onClick={quickFill} disabled={busy} style={{
          flex: 1,
          padding: '8px 0',
          background: 'transparent',
          border: '1px dashed var(--accent)',
          color: 'var(--accent)',
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          letterSpacing: '0.15em',
          cursor: 'pointer',
          borderRadius: 2,
          transition: 'background 0.2s'
        }}>
            ⚡ QUICK FILL
          </button>
          <button type="button" onClick={quickRegister} disabled={busy} style={{
          flex: 1,
          padding: '8px 0',
          background: 'rgba(63,169,245,0.12)',
          border: '1px solid var(--accent)',
          color: '#fff',
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          letterSpacing: '0.15em',
          cursor: 'pointer',
          borderRadius: 2,
          fontWeight: 700
        }}>
            {busy ? '...' : '🚀 SKIP & ENTER'}
          </button>
        </div>

        <SystemWindow title="Integration Sequence">
          <form onSubmit={onSubmit}>
            <div className="field">
              <label>Username</label>
              <input required minLength={3} maxLength={20} value={username} onChange={e => setUsername(e.target.value)} />
            </div>
            <div className="field">
              <label>Email</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="field">
              <label>Password</label>
              <input type="password" required minLength={8} value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            <div className="field">
              <label>Confirm Password</label>
              <input type="password" required minLength={8} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
            </div>
            <div className="field">
              <label>Character Name</label>
              <input required minLength={2} maxLength={20} value={characterName} onChange={e => setCharacterName(e.target.value)} />
            </div>
            <div className="field">
              <label>Class</label>
              <select value={characterClass} onChange={e => setCharacterClass(e.target.value)}>
                {CLASSES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            {error && <ErrorState message={error} />}
            <button className="btn" type="submit" disabled={busy} style={{
            width: '100%',
            marginTop: '10px'
          }}>
              {busy ? 'Creating...' : 'Begin'}
            </button>
          </form>
        </SystemWindow>
        <div style={{
        textAlign: 'center',
        marginTop: 16,
        fontFamily: 'var(--font-mono)',
        fontSize: 12,
        color: 'var(--text-dim)'
      }}>
          Already have an account? <Link to="/login" style={{
          color: 'var(--accent-soft)'
        }}>Log in</Link>
        </div>
      </div>
    </div>;
}