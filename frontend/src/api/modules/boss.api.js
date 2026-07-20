import { api } from '../client';
export const bossApi = {
  getActive: () => api.get('/bosses/active'),
  getStatus: () => api.get('/bosses/status'),
  damage: (bossId, exerciseType, amount, weaponId) => api.post('/bosses/damage', {
    bossId,
    exerciseType,
    amount,
    weaponId
  })
};