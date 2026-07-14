import { api } from '../client';

export interface WorldBoss {
  id: string;
  name: string;
  lore: string;
  tier: 'common' | 'elite' | 'legendary' | 'mythic' | 'immortal';
  requirements?: Record<string, unknown>;
  rewards?: Record<string, unknown>;
  hp: number;
  maxHp: number;
  weekNumber: number;
  endDate: string;
  isActive: boolean;
}

export type BossStatus =
  | { active: true; boss: WorldBoss }
  | { active: false; nextSpawnAt: string };

export const bossApi = {
  getActive: () => api.get<WorldBoss>('/bosses/active'),
  getStatus: () => api.get<BossStatus>('/bosses/status'),
  damage: (bossId: string, exerciseType: string, amount: number, weaponId?: string) => 
    api.post<WorldBoss>('/bosses/damage', { bossId, exerciseType, amount, weaponId })
};
