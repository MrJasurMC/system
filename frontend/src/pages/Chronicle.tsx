import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { getErrorMessage } from '../utils/errors';
import { ErrorState } from '../components/ui/ErrorState';
import { SystemWindow } from '../components/SystemWindow';

export interface ChronicleEntry {
  id: string;
  type: string;
  title: string;
  description: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

interface Achievement {
  id: string;
  title: string;
  description?: string;
  points: number;
  hidden: boolean;
}

interface UserAchievement {
  id: string;
  achievementId: string;
  progress?: number;
  unlockedAt?: string | null;
  achievement: Achievement;
}

const typeIcon: Record<string, string> = {
  quest: '◈',
  boss: '⚔',
  promotion: '▲',
  story: '📖',
  event: '★',
};

const typeColor: Record<string, string> = {
  quest: '#00d2ff',
  boss: '#ff4d4d',
  promotion: '#ffd700',
  story: '#a29bfe',
  event: '#ff9ff3',
};

type Tab = 'timeline' | 'achievements';

export function Chronicle() {
  const [tab, setTab] = useState<Tab>('timeline');

  const [entries, setEntries] = useState<ChronicleEntry[]>([]);
  const [timelineError, setTimelineError] = useState('');

  const [allAchievements, setAllAchievements] = useState<Achievement[]>([]);
  const [mineAchievements, setMineAchievements] = useState<UserAchievement[]>([]);
  const [achievementsError, setAchievementsError] = useState('');

  useEffect(() => {
    async function loadTimeline() {
      try {
        setEntries(await api.get<ChronicleEntry[]>('/chronicles'));
      } catch (err: unknown) {
        setTimelineError(getErrorMessage(err, 'Failed to load chronicles.'));
      }
    }
    async function loadAchievements() {
      try {
        const [a, m] = await Promise.all([
          api.get<Achievement[]>('/achievements'),
          api.get<UserAchievement[]>('/achievements/mine'),
        ]);
        setAllAchievements(a);
        setMineAchievements(m);
      } catch (err: unknown) {
        setAchievementsError(getErrorMessage(err, 'Failed to load achievements.'));
      }
    }
    loadTimeline();
    loadAchievements();
  }, []);

  const unlockedIds = new Set(mineAchievements.filter((m) => m.unlockedAt).map((m) => m.achievementId));

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">
          Chronicle
          <small>YOUR LEGACY</small>
        </h1>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 20, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <button
          className="btn ghost"
          style={{ borderRadius: '8px 8px 0 0', borderBottom: tab === 'timeline' ? '2px solid var(--color-primary)' : '2px solid transparent' }}
          onClick={() => setTab('timeline')}
        >
          Timeline
        </button>
        <button
          className="btn ghost"
          style={{ borderRadius: '8px 8px 0 0', borderBottom: tab === 'achievements' ? '2px solid var(--color-primary)' : '2px solid transparent' }}
          onClick={() => setTab('achievements')}
        >
          Achievements {allAchievements.length > 0 && `(${unlockedIds.size}/${allAchievements.length})`}
        </button>
      </div>

      {tab === 'timeline' && (
        <>
          {timelineError && <ErrorState message={timelineError} onRetry={() => window.location.reload()} />}
          <div style={{ marginTop: 32, paddingLeft: 24, borderLeft: '2px solid rgba(255, 255, 255, 0.1)', position: 'relative' }}>
            {entries.length === 0 && !timelineError && (
              <div className="empty-state">No chronicle entries yet. Your story has just begun.</div>
            )}

            {entries.map((entry) => (
              <div key={entry.id} style={{ position: 'relative', marginBottom: 32 }}>
                <div style={{
                  position: 'absolute',
                  left: -41,
                  top: 0,
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  backgroundColor: '#121212',
                  border: `2px solid ${typeColor[entry.type] || '#fff'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                  color: typeColor[entry.type] || '#fff',
                }}>
                  {typeIcon[entry.type] || '•'}
                </div>

                <div style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  padding: 24,
                  borderRadius: 12,
                  transition: 'transform 0.2s, background 0.2s',
                }}
                className="hover-card"
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ color: typeColor[entry.type] || '#fff', textTransform: 'uppercase', fontSize: 12, fontWeight: 'bold', letterSpacing: 1 }}>
                      {entry.type}
                    </span>
                    <span style={{ color: 'var(--text-dim)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
                      {new Date(entry.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 style={{ margin: '0 0 8px 0', fontSize: entry.type === 'story' ? 24 : 18 }}>
                    {entry.title}
                  </h3>

                  <p style={{ color: 'var(--text-dim)', margin: 0, lineHeight: 1.6, fontSize: entry.type === 'story' ? 16 : 14 }}>
                    {entry.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'achievements' && (
        <SystemWindow title="Records" style={{ marginTop: 24 }}>
          {achievementsError && <ErrorState message={achievementsError} />}
          {!achievementsError && allAchievements.length === 0 && <div className="empty-state">No achievements defined yet.</div>}
          {allAchievements.map((a) => {
            const unlocked = unlockedIds.has(a.id);
            return (
              <div key={a.id} className="list-row" style={{ opacity: unlocked ? 1 : 0.5 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{a.title}</div>
                  {a.description && <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>{a.description}</div>}
                </div>
                <span className={`badge ${unlocked ? 'gold' : ''}`}>{unlocked ? 'unlocked' : `${a.points} pts`}</span>
              </div>
            );
          })}
        </SystemWindow>
      )}

      <style>{`
        .hover-card:hover {
          transform: translateX(4px);
          background: rgba(255, 255, 255, 0.05);
        }
      `}</style>
    </>
  );
}
