import { useQuery } from '@tanstack/react-query';
import { achievementsApi } from '../api/modules/achievements.api';
export function useAchievements() {
  const {
    data: all,
    isLoading: loadingAll,
    error: errorAll
  } = useQuery({
    queryKey: ['achievements', 'all'],
    queryFn: achievementsApi.findAll
  });
  const {
    data: mine,
    isLoading: loadingMine,
    error: errorMine
  } = useQuery({
    queryKey: ['achievements', 'mine'],
    queryFn: achievementsApi.findMine
  });
  const byAchievementId = new Map((mine ?? []).map(ua => [ua.achievementId, ua]));
  const merged = (all ?? []).map(a => {
    const ua = byAchievementId.get(a.id);
    return {
      id: a.id,
      key: a.key,
      title: a.title,
      description: a.description,
      howToUnlock: a.howToUnlock,
      rarity: a.rarity,
      points: a.points,
      icon: a.icon,
      rewards: a.rewards,
      unlocked: ua?.unlocked ?? false,
      progress: ua?.progress ?? 0,
      unlockedAt: ua?.unlockedAt
    };
  });

  // Hidden achievements only ever show up here once unlocked (findAll()
  // excludes hidden=true server-side) — surface any unlocked-but-not-in-`all`
  // entries from `mine` so a secret achievement doesn't just vanish after
  // it's earned.
  const mergedIds = new Set(merged.map(m => m.id));
  for (const ua of mine ?? []) {
    if (ua.unlocked && !mergedIds.has(ua.achievementId)) {
      merged.push({
        id: ua.achievement.id,
        key: ua.achievement.key,
        title: ua.achievement.title,
        description: ua.achievement.description,
        howToUnlock: ua.achievement.howToUnlock,
        rarity: ua.achievement.rarity,
        points: ua.achievement.points,
        icon: ua.achievement.icon,
        rewards: ua.achievement.rewards,
        unlocked: true,
        progress: ua.progress,
        unlockedAt: ua.unlockedAt
      });
    }
  }
  merged.sort((a, b) => Number(b.unlocked) - Number(a.unlocked));
  return {
    achievements: merged,
    unlockedCount: merged.filter(a => a.unlocked).length,
    totalPoints: merged.filter(a => a.unlocked).reduce((sum, a) => sum + a.points, 0),
    isLoading: loadingAll || loadingMine,
    error: errorAll || errorMine
  };
}