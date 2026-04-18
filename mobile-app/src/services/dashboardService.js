import api from './api';

export const dashboardService = {
  // Engineer: get own site summary
  engineerSummary: (siteId) =>
    api.get('/dashboard/engineer', { params: { siteId } }),

  // Manager: get site dashboard
  managerSummary: (siteId) =>
    api.get('/dashboard/manager', { params: { siteId } }),

  // Admin mobile: high level overview
  adminOverview: () =>
    api.get('/admin/analytics/overview'),
};
