import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
export function Welcome() {
  const {
    user
  } = useAuth();
  const nav = useNavigate();
  const [awakened, setAwakened] = useState(false);
  useEffect(() => {
    if (user) {
      nav('/');
    }
  }, [user, nav]);
  useEffect(() => {
    // Add a soft glow to the background after the first text appears
    const timer = setTimeout(() => setAwakened(true), 300);
    return () => clearTimeout(timer);
  }, []);
  return <div className={`welcome-shell ${awakened ? 'awakened' : ''}`}>
      <div className="welcome-text welcome-text-delay-1">Welcome.</div>
      <div className="welcome-text welcome-text-delay-2" style={{
      marginTop: '20px'
    }}>
        You have been selected. Now you need to cook
      </div>
      
      <div className="welcome-action">
        <button className="btn-awaken" onClick={() => nav('/create-character')}>
          Accept
        </button>
        <div style={{
        marginTop: '20px',
        fontSize: '11px',
        fontFamily: 'var(--font-mono)',
        color: 'var(--text-dim)',
        letterSpacing: '0.1em'
      }}>
          Returning Entity? <span style={{
          color: 'var(--accent)',
          cursor: 'pointer'
        }} onClick={() => nav('/login')}>Access System</span>
        </div>
      </div>
    </div>;
}