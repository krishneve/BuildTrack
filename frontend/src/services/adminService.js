import api from './api';
export const adminService = {
  getDashboard: () => api.get('/admin/dashboard'),
  getAnalyticsOverview: () => api.get('/admin/analytics/overview'),
  getCostComparison: () => api.get('/admin/analytics/cost-comparison'),
};
