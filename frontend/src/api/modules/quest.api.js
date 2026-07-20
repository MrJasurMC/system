import { api } from '../client';
export const questApi = {
  getMine: () => api.get('/quests/mine'),
  getAll: () => api.get('/quests'),
  accept: questId => api.post(`/quests/${questId}/accept`),
  progress: (questId, progressAmount) => api.put(`/quests/${questId}/progress`, {
    progress: progressAmount
  })
};