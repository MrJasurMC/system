import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import { SystemWindow } from '../components/SystemWindow';
import { StatBar } from '../components/StatBar';
import { CharacterPortrait } from '../components/character/CharacterPortrait';
import { getErrorMessage } from '../utils/errors';
import { ErrorState } from '../components/ui/ErrorState';
import { useCharacter, type CharacterData, type Attributes } from '../hooks/useCharacter';
import { useAchievements } from '../hooks/useAchievements';
import { MissionChecklist } from '../components/MissionChecklist';

/** Mirrors backend rankForLevel() in leveling.ts — keep these two in sync. */
const RANK_TIERS: { level: number; rank: string }[] = [
  { level: 5, rank: 'Novice' },
  { level: 10, rank: 'Disciple' },
  { level: 20, rank: 'Elite' },
  { level: 35, rank: 'Champion' },
  { level: 50, rank: 'Ascendant' },
  { level: 75, rank: 'Legend' },
  { level: 100, rank: 'Mythic' },
];

function nextRankMilestone(level: number): { level: number; rank: string } | null {
  return RANK_TIERS.find((tier) => level < tier.level) ?? null;
}
function motivationLine(char: CharacterData, activeQuest: QuestProgress | null): string {
  const questDone = activeQuest?.status === 'complete' || activeQuest?.status === 'claimed';
  if (questDone) return 'Evolution complete. Tomorrow we climb higher.';
  if (char.currentStreak === 0) return "One missed day doesn't define your journey. Start today.";
  if (char.currentStreak >= 30) return 'Your consistency is becoming your greatest strength.';
  if (char.currentStreak >= 7) return "A week of discipline down. You're building something real.";
  return 'Every day you show up, you evolve a little more.';
}

const STAT_KEYS: (keyof Omit<Attributes, 'unallocatedPoints'>)[] = [
  'strength',
  'agility',
  'endurance',
  'speed',
  'recovery',
];

interface Quest {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  goldReward: number;
}

interface QuestProgress {
  id: string;
  status: string;
  progress: number;
  quest: Quest;
}

export function Dashboard() {
  const { data: char, isLoading, error: queryError, refetch } = useCharacter();
  const { unlockedCount } = useAchievements();
  const [activeQuest, setActiveQuest] = useState<QuestProgress | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [pending, setPending] = useState<Record<string, number>>({});

  async function loadActiveQuest() {
    try {
      const quests = await api.get<QuestProgress[]>('/quests/mine');
      const current = quests.find((q) => q.status === 'in_progress' || q.status === 'accepted');
      setActiveQuest(current || null);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Could not load quest data.'));
    }
  }

  useEffect(() => {
    loadActiveQuest();
  }, []);

  if (queryError) {
    // 404 here means the account has no character yet (new registration) —
    // "Retry Protocol" would just 404 forever, so send them to create one
    // instead of leaving them stuck on a dead-end error screen.
    if (queryError instanceof ApiError && queryError.status === 404) {
      return <Navigate to="/create-character" replace />;
    }
    return <ErrorState message={getErrorMessage(queryError, 'Could not load character data.')} onRetry={refetch} />;
  }
  if (isLoading || !char) return <span className="loading-line">LOADING STATUS WINDOW...</span>;

  const spentLocally = Object.values(pending).reduce((a, b) => a + b, 0);
  const remaining = char.attributes.unallocatedPoints - spentLocally;

  function bump(key: string, delta: number) {
    setPending((p) => {
      const next = { ...p, [key]: (p[key] ?? 0) + delta };
      if (next[key] <= 0) delete next[key];
      return next;
    });
  }

  async function save() {
    if (!Object.keys(pending).length) return;
    setSaving(true);
    try {
      await api.patch(`/characters/${char!.id}/attributes`, pending);
      setPending({});
      await refetch();
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to allocate points.'));
    } finally {
      setSaving(false);
    }
  }

  if (error) return <ErrorState message={error} onRetry={() => { setError(''); loadActiveQuest(); }} />;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', paddingBottom: 60 }}>
      {/* 1. PLAYER INFORMATION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, padding: '0 16px' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 700, letterSpacing: '0.05em' }}>
            {char.name}
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-dim)', marginTop: 4, letterSpacing: '0.1em' }}>
            <span style={{ color: 'var(--text)' }}>LV.{char.level}</span> <span style={{ margin: '0 8px' }}>|</span>{' '}
            <span style={{ color: 'var(--violet)', fontWeight: 600, textTransform: 'uppercase' }}>{char.rank}</span> <span style={{ margin: '0 8px' }}>|</span>{' '}
            <span style={{ textTransform: 'uppercase' }}>{char.class}</span>
          </div>
        </div>
        <div className="badge gold" style={{ fontSize: 14, padding: '6px 12px' }}>
          {char.gold} GOLD
        </div>
      </div>

      {/* 1b. CONTEXTUAL MOTIVATION */}
      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--accent-soft)',
        padding: '10px 16px', marginBottom: 20, borderLeft: '2px solid var(--accent)',
      }}>
        {motivationLine(char, activeQuest)}
      </div>

      {/* 2. ANIMATED AVATAR */}
      <div style={{ marginBottom: 32, position: 'relative' }}>
        {/* We keep the avatar large and central */}
        <CharacterPortrait level={char.level} />
      </div>

      {/* 3. VITALS (2 Columns) */}
      <div className="page-grid cols-2" style={{ marginBottom: 24 }}>
        <SystemWindow title="Vitals">
          <StatBar label="HP" value={char.hp} max={char.maxHp} variant="hp" />
          <div style={{ height: 12 }} />
          <StatBar label="MP" value={char.mp} max={char.maxMp} variant="blue" />
        </SystemWindow>

        <SystemWindow title="Progression">
          <StatBar label="XP" value={char.exp} max={char.expToNextLevel} variant="green" />
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-dim)', marginTop: 8, textAlign: 'right' }}>
            {char.exp.toLocaleString()} / {char.expToNextLevel.toLocaleString()} XP
          </div>
        </SystemWindow>
      </div>

      {/* 4. ATTRIBUTES (Premium Cards) */}
      <SystemWindow title="Attributes" style={{ marginBottom: 24 }}>
        <div style={{ marginBottom: 16, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-dim)', display: 'flex', justifyContent: 'space-between' }}>
          <span>Allocate points to increase your power.</span>
          <span>Unallocated: <b style={{ color: 'var(--accent)' }}>{remaining}</b></span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
          {STAT_KEYS.map((key) => (
            <div key={key} className="attr-card">
              <div className="attr-header">
                <span className="attr-name">{key}</span>
                <span className="attr-val">{char.attributes[key] + (pending[key] ?? 0)}</span>
              </div>
              <div style={{ display: 'flex', gap: 4, marginTop: 'auto' }}>
                <button className="btn ghost" style={{ flex: 1, padding: '4px' }} disabled={!pending[key]} onClick={() => bump(key, -1)}>−</button>
                <button className="btn ghost" style={{ flex: 1, padding: '4px' }} disabled={remaining <= 0} onClick={() => bump(key, 1)}>+</button>
              </div>
            </div>
          ))}
        </div>
        {spentLocally > 0 && (
          <button className="btn-awaken" style={{ marginTop: 16, width: '100%' }} disabled={saving} onClick={save}>
            {saving ? 'Integrating...' : 'Confirm Allocation'}
          </button>
        )}
      </SystemWindow>

      {/* 5. QUICK STATISTICS & ACTIVE QUEST */}
      <div className="page-grid cols-2" style={{ marginBottom: 24 }}>
        <SystemWindow title="Quick Stats">
          <div className="list-row"><span>Current Streak</span><b style={{ color: 'var(--text)' }}>{char.currentStreak} Day{char.currentStreak === 1 ? '' : 's'}</b></div>
          <div className="list-row"><span>Longest Streak</span><b style={{ color: 'var(--text)' }}>{char.longestStreak} Day{char.longestStreak === 1 ? '' : 's'}</b></div>
          <div className="list-row"><span>Quests Completed</span><b style={{ color: 'var(--text)' }}>{char.totalQuestsCompleted ?? 0}</b></div>
          <div className="list-row"><span>Bosses Defeated</span><b style={{ color: 'var(--text)' }}>{char.totalBossesDefeated ?? 0}</b></div>
          <div className="list-row" style={{ borderBottom: 'none' }}><span>Achievements</span><b style={{ color: 'var(--text)' }}>{unlockedCount}</b></div>
        </SystemWindow>

        <SystemWindow title="Active Mission" style={{ border: '1px solid var(--accent)', boxShadow: '0 0 20px rgba(63, 169, 245, 0.08)' }}>
          {activeQuest ? (
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--accent)', marginBottom: 8 }}>
                {activeQuest.quest.title}
              </div>
              <MissionChecklist description={activeQuest.quest.description} />
              {/* marginBottom clears the system-window's clipped corner — without it, a
                  long task list can push these badges flush against the bottom edge,
                  where the octagon clip-path slices diagonally through them. */}
              <div style={{ display: 'flex', gap: 8, marginTop: 16, marginBottom: 6 }}>
                <span className="badge green">+{activeQuest.quest.xpReward} XP</span>
                <span className="badge gold">+{activeQuest.quest.goldReward} GOLD</span>
              </div>
            </div>
          ) : (
            <div className="empty-state">No Active Quest Found.</div>
          )}
        </SystemWindow>
      </div>

      {/* 6. NEXT RANK PROGRESS */}
      <SystemWindow title="Next Rank Milestone">
        {(() => {
          const next = nextRankMilestone(char.level);
          if (!next) {
            return (
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--gold)', textAlign: 'center', padding: '8px 0' }}>
                Maximum rank achieved. There is no one above you.
              </div>
            );
          }
          return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--text)' }}>
                  Target: <span style={{ color: 'var(--violet)' }}>{next.rank}</span>
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>
                  Requires Level {next.level}. ({next.level - char.level} to go)
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--accent-soft)' }}>
                  Rewards Preview:
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>
                  +5 All Stats<br/>
                  New Title<br/>
                  Trial Access
                </div>
              </div>
            </div>
          );
        })()}
      </SystemWindow>
    </div>
  );
}
