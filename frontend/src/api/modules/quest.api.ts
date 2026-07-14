import { api } from '../client';

export interface Quest {
  id: string;
  title: string;
  description?: string;
  type: string;
  difficulty: string;
  rarity: string;
  icon?: string;
  goal: string;
  goalValue: number;
  xpReward: number;
  goldReward: number;
  attributeReward?: Record<string, number>;
  itemRewards?: Record<string, unknown>;
  requiredPreviousQuestId?: string;
  isChain: boolean;
  estimatedTime?: number;
  expiresAt?: string;
  active: boolean;
}

export interface QuestProgress {
  id: string;
  questId: string;
  status: string;
  progress: number;
  quest: Quest;
  createdAt: string;
}

export const questApi = {
  getMine: () => api.get<QuestProgress[]>('/quests/mine'),
  getAll: () => api.get<Quest[]>('/quests'),
  accept: (questId: string) => api.post<QuestProgress>(`/quests/${questId}/accept`),
  progress: (questId: string, progressAmount: number) => 
    api.put(`/quests/${questId}/progress`, { progress: progressAmount }),
};
