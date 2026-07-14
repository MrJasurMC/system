import { api } from '../client';

export interface Achievement {
  id: string;
  key: string;
  title: string;
  description?: string;
  howToUnlock?: string;
  rarity: string;
  points: number;
  icon?: string;
  hidden: boolean;
  rewards?: { xp?: number; gold?: number; itemIds?: string[] };
}

export interface UserAchievement {
  id: string;
  achievementId: string;
  unlocked: boolean;
  progress: number;
  unlockedAt?: string;
  achievement: Achievement;
}

export const achievementsApi = {
  findAll: () => api.get<Achievement[]>('/achievements'),
  findMine: () => api.get<UserAchievement[]>('/achievements/mine'),
};
