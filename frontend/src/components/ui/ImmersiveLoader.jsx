import { useEffect, useState } from 'react';
export function ImmersiveLoader() {
  const [dots, setDots] = useState('');
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);
  return <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    background: 'var(--bg)',
    color: 'var(--text-dim)',
    fontFamily: 'var(--font-mono)',
    fontSize: 14,
    letterSpacing: '0.2em'
  }}>
      <div style={{
      width: 40,
      height: 40,
      border: '2px solid var(--accent-dim)',
      borderTopColor: 'var(--accent)',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
      marginBottom: 24
    }} />
      LOADING SYSTEM PROTOCOLS{dots}
      <style>
        {`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>;
}