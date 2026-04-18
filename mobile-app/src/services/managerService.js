import api from './api';

export const managerService = {
  getDashboard:     (siteId) => api.get('/manager/dashboard', { params: { siteId } }),
  getSiteSummary:   (siteId) => api.get('/manager/reports/site-summary', { params: { siteId } }),
  getProductivity:  (siteId, days) => api.get('/manager/reports/worker-productivity', { params: { siteId, days } }),
};
