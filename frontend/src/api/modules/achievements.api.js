import { api } from '../client';
export const achievementsApi = {
  findAll: () => api.get('/achievements'),
  findMine: () => api.get('/achievements/mine')
};