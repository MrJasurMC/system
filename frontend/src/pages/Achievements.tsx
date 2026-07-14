import { getErrorMessage } from '../utils/errors';
import { ErrorState } from '../components/ui/ErrorState';
import { SystemWindow } from '../components/SystemWindow';
import { useAchievements } from '../hooks/useAchievements';
import { ProceduralIcon } from '../components/icons/ProceduralIcon';
import { resolveAchievementIconCategory } from '../components/icons/iconMapping';
import { RARITY_COLOR } from '../constants/rarityColors';

const rarityBadge: Record<string, string> = {
  common: '',
  uncommon: 'green',
  rare: 'blue',
  epic: 'violet',
  legendary: 'gold',
  mythic: 'red',
};

const rarityGlow: Record<string, string> = {
  common: 'transparent',
  uncommon: 'rgba(52,211,153,0.25)',
  rare: 'rgba(63,169,245,0.25)',
  epic: 'rgba(139,92,246,0.3)',
  legendary: 'rgba(234,179,8,0.3)',
  mythic: 'rgba(239,68,68,0.3)',
};

export function Achievements() {
  const { achievements, unlockedCount, totalPoints, isLoading, error } = useAchievements();

  if (isLoading) {
    return <div className="loading-line" style={{ margin: '80px auto', textAlign: 'center' }}>LOADING ACHIEVEMENTS...</div>;
  }
  if (error) {
    return <ErrorState message={getErrorMessage(error, 'Failed to load achievements.')} onRetry={() => window.location.reload()} />;
  }

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">
          Achievements
          <small>{unlockedCount} / {achievements.length} UNLOCKED · {totalPoints} POINTS</small>
        </h1>
      </div>

      <div className="page-grid cols-3">
        {achievements.map((a) => (
          <SystemWindow
            key={a.id}
            title={a.title}
            style={{
              opacity: a.unlocked ? 1 : 0.55,
              border: a.unlocked ? `1px solid ${rarityGlow[a.rarity] === 'transparent' ? 'var(--border)' : rarityGlow[a.rarity]}` : undefined,
              boxShadow: a.unlocked && rarityGlow[a.rarity] !== 'transparent' ? `0 0 18px ${rarityGlow[a.rarity]}` : undefined,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div
                style={{
                  fontSize: 30,
                  width: 48,
                  height: 48,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'var(--panel)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  flexShrink: 0,
                  filter: a.unlocked ? 'none' : 'grayscale(1) brightness(0.6)',
                }}
              >
                <ProceduralIcon
                  seed={a.title}
                  category={resolveAchievementIconCategory(a)}
                  color={RARITY_COLOR[a.rarity] ?? RARITY_COLOR.common}
                  size={30}
                />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700 }}>
                    {a.title}
                  </div>
                  <span className={`badge ${rarityBadge[a.rarity] ?? ''}`} style={{ fontSize: 9 }}>
                    {a.rarity}
                  </span>
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--text-dim)', marginTop: 4, lineHeight: 1.5 }}>
                  {a.unlocked || !a.description ? a.description : '???'}
                </div>
              </div>
            </div>

            <div style={{ marginTop: 12, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.6 }}>
              <span style={{ color: 'var(--accent-soft)' }}>HOW TO UNLOCK: </span>
              {a.unlocked ? (a.howToUnlock ?? 'Unlocked.') : (a.howToUnlock ?? 'Keep playing to discover this one.')}
            </div>

            <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {a.unlocked ? (
                <span className="badge green" style={{ fontSize: 10 }}>
                  ✓ Unlocked{a.unlockedAt ? ` · ${new Date(a.unlockedAt).toLocaleDateString()}` : ''}
                </span>
              ) : (
                <span className="badge" style={{ fontSize: 10 }}>Locked</span>
              )}
              {a.rewards?.xp ? <span className="badge blue" style={{ fontSize: 10 }}>+{a.rewards.xp} XP</span> : null}
              {a.rewards?.gold ? <span className="badge gold" style={{ fontSize: 10 }}>+{a.rewards.gold} Gold</span> : null}
              <span className="badge" style={{ fontSize: 10 }}>{a.points} pts</span>
            </div>
          </SystemWindow>
        ))}
      </div>

      {achievements.length === 0 && <div className="empty-state">No achievements loaded yet.</div>}
    </>
  );
}
