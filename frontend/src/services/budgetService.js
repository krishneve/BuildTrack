import api from './api';
export const budgetService = {
  getAll: () => api.get('/admin/budgets'),
  create: (data) => api.post('/admin/budgets', data),
  update: (siteId, data) => api.put(`/admin/budgets/${siteId}`, data),
  getSummary: (siteId) => api.get(`/admin/budgets/${siteId}/summary`),
};
