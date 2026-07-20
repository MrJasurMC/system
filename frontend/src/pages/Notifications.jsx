import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { getErrorMessage } from '../utils/errors';
import { ErrorState } from '../components/ui/ErrorState';
import { SystemWindow } from '../components/SystemWindow';
const typeBadge = {
  quest: 'blue',
  achievement: 'gold',
  level_up: 'green',
  trial: 'violet',
  system: 'gray'
};
export function Notifications() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  async function load() {
    try {
      setItems(await api.get('/notifications'));
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load notifications.'));
    }
  }
  useEffect(() => {
    load();
  }, []);
  async function markRead(id) {
    try {
      await api.patch(`/notifications/${id}/read`);
      setItems(prev => prev.map(n => n.id === id ? {
        ...n,
        readAt: new Date().toISOString()
      } : n));
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to clear notifications.'));
    }
  }
  async function remove(id) {
    try {
      await api.delete(`/notifications/${id}`);
      setItems(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to delete notification.'));
    }
  }
  async function clearAll() {
    try {
      await api.delete('/notifications/clear');
      setItems([]);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to clear notifications.'));
    }
  }
  return <>
      <div className="page-header">
        <h1 className="page-title">
          Notifications
          <small>{items.filter(n => !n.readAt).length} UNREAD</small>
        </h1>
        {items.length > 0 && <button className="btn ghost" onClick={clearAll}>
            Clear all
          </button>}
      </div>

      {error && <ErrorState message={error} onRetry={load} />}

      <SystemWindow title="Log">
        {items.length === 0 && <div className="empty-state">No notifications yet.</div>}
        {items.map(n => <div key={n.id} className="list-row" style={{
        opacity: n.readAt ? 0.55 : 1
      }}>
            <div>
              <div style={{
            fontSize: 13.5
          }}>{n.message}</div>
              <span className={`badge ${typeBadge[n.type] ?? ''}`} style={{
            marginTop: 4
          }}>{n.type.replace('_', ' ')}</span>
            </div>
            <div style={{
          display: 'flex',
          gap: 8
        }}>
              {!n.readAt && <button className="btn ghost" onClick={() => markRead(n.id)}>
                  Mark read
                </button>}
              <button className="btn ghost" onClick={() => remove(n.id)} aria-label="Delete notification">
                ✕
              </button>
            </div>
          </div>)}
      </SystemWindow>
    </>;
}