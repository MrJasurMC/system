import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCharacter } from '../hooks/useCharacter';

/** One consistent stroke-icon language for the whole nav — previously a mix
 * of unicode glyphs (◆ ◈ ⚔ ❂ ■) and emoji (🏆 📜 ✉ ⚙), which rendered
 * inconsistently across platforms (emoji pull in full-color OS glyphs that
 * clash with the mono/line aesthetic everything else uses). All 18x18,
 * 1.5px stroke, currentColor — matches the old Settings gear look. */
function NavIcon({ name }: { name: string }) {
  const common = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (name) {
    case 'status':
      return <svg {...common}><path d="M3 17l6-6 4 4 8-8" /><path d="M15 7h6v6" /></svg>;
    case 'quests':
      return <svg {...common}><path d="M9 4h9v16H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h3z" /><path d="M9 4v4h6" /><path d="M8 12h8M8 16h5" /></svg>;
    case 'boss':
      return <svg {...common}><path d="M12 2l2.2 4.5L19 7.3l-3.5 3.4.8 4.8L12 13.2 7.7 15.5l.8-4.8L5 7.3l4.8-.8z" /></svg>;
    case 'exchange':
      return <svg {...common}><path d="M4 7h13l-3-3M20 17H7l3 3" /></svg>;
    case 'inventory':
      return <svg {...common}><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M3 11h18M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>;
    case 'achievements':
      return <svg {...common}><path d="M8 4h8v5a4 4 0 0 1-8 0V4z" /><path d="M8 5H5a3 3 0 0 0 3 5M16 5h3a3 3 0 0 1-3 5" /><path d="M12 13v3M9 20h6M10 20v-2h4v2" /></svg>;
    case 'chronicle':
      return <svg {...common}><path d="M6 4h11a2 2 0 0 1 2 2v14l-3-2-3 2-3-2-3 2V6a2 2 0 0 1 2-2z" /><path d="M9 8h6M9 11h6" /></svg>;
    case 'notifications':
      return <svg {...common}><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></svg>;
    case 'settings':
      return <svg {...common}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></svg>;
    case 'nutrition':
      return <svg {...common}><path d="M12 3c-3 2.5-5 5.8-5 9a5 5 0 0 0 10 0c0-3.2-2-6.5-5-9z" /><path d="M12 8v9" /></svg>;
    case 'bioscan':
      return <svg {...common}><path d="M4 8V5a1 1 0 0 1 1-1h3M20 8V5a1 1 0 0 0-1-1h-3M4 16v3a1 1 0 0 0 1 1h3M20 16v3a1 1 0 0 1-1 1h-3" /><circle cx="12" cy="12" r="3.5" /></svg>;
    default:
      return null;
  }
}

const links = [
  { to: '/', label: 'Status', icon: 'status' },
  { to: '/quests', label: 'Quests', icon: 'quests' },
  { to: '/boss', label: 'World Boss', icon: 'boss' },
  { to: '/exchange', label: 'Exchange', icon: 'exchange' },
  { to: '/inventory', label: 'Inventory', icon: 'inventory' },
  { to: '/achievements', label: 'Achievements', icon: 'achievements' },
  { to: '/chronicle', label: 'Chronicle', icon: 'chronicle' },
  { to: '/notifications', label: 'Notifications', icon: 'notifications' },
  { to: '/nutrition', label: 'Nutrition', icon: 'nutrition' },
  { to: '/settings', label: 'Settings', icon: 'settings' },
];

export function Sidebar() {
  const { user, logout } = useAuth();
  const { data: char } = useCharacter();
  const pct = char ? Math.min(100, (char.exp / char.expToNextLevel) * 100) : 0;
  const [open, setOpen] = useState(false);

  const nav = (
    <>
      <div className="sidebar-brand">
        SYSTEM
        <span>fitness rpg</span>
      </div>
      {links.map((l) => (
        <NavLink
          key={l.to}
          to={l.to}
          end={l.to === '/'}
          className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}
          onClick={() => setOpen(false)}
        >
          <span aria-hidden style={{ display: 'inline-flex' }}><NavIcon name={l.icon} /></span> {l.label}
        </NavLink>
      ))}
      <div className="nav-footer">
        {char && (
          <div id="global-xp-bar" style={{ padding: '0 12px 12px' }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
              fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-dim)', marginBottom: 5,
              letterSpacing: '0.06em', textTransform: 'uppercase',
            }}>
              <span>Lv. {char.level} · {char.rank}</span>
              <span>{char.exp}/{char.expToNextLevel}</span>
            </div>
            <div className="bar-track" style={{ height: 5 }}>
              <div className="bar-fill" style={{ width: `${pct}%`, transition: 'width 0.6s ease' }} />
            </div>
          </div>
        )}
        <div style={{
          margin: '0 12px 12px', padding: 10, borderRadius: 8,
          border: '1px solid var(--border)', background: 'var(--panel-raised)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{
            width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, var(--accent), var(--violet))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: '#05070d',
          }}>
            {user?.displayName?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.displayName}
          </div>
        </div>
        <div style={{ padding: '0 12px 10px' }}>
          <button className="btn ghost" style={{ width: '100%' }} onClick={() => logout()}>
            Log out
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile top bar — only visible under the 860px breakpoint (see index.css) */}
      <div className="mobile-topbar">
        <button
          className="mobile-menu-btn"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span /><span /><span />
        </button>
        <div className="sidebar-brand" style={{ padding: 0 }}>
          SYSTEM
        </div>
        {char && <span className="badge">Lv. {char.level}</span>}
      </div>

      {open && <div className="mobile-scrim" onClick={() => setOpen(false)} />}

      <aside className={'sidebar' + (open ? ' open' : '')}>{nav}</aside>
    </>
  );
}
