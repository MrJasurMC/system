
export function ErrorState({
  message,
  onRetry,
  icon
}) {
  return <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 24px',
    background: 'rgba(255, 0, 0, 0.03)',
    border: '1px solid rgba(255, 77, 77, 0.2)',
    borderRadius: 12,
    textAlign: 'center',
    margin: '24px 0'
  }}>
      <div style={{
      fontSize: 32,
      color: 'var(--red)',
      marginBottom: 16
    }}>
        {icon || '⚠'}
      </div>
      
      <div style={{
      fontFamily: 'var(--font-mono)',
      fontSize: 14,
      color: 'var(--text-dim)',
      marginBottom: onRetry ? 24 : 0,
      maxWidth: 400,
      lineHeight: 1.6
    }}>
        {message}
      </div>
      
      {onRetry && <button className="btn" onClick={onRetry} style={{
      borderColor: 'var(--red)',
      color: 'var(--red)'
    }}>
          RETRY PROTOCOL
        </button>}
    </div>;
}