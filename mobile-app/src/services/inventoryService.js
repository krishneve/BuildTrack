import api from './api';

export const inventoryService = {
  // Get stock levels for a site
  getStock: (siteId) =>
    api.get('/inventory', { params: { siteId } }),

  // Engineer: log material IN or OUT
  logMaterial: (siteId, materialId, type, quantity, notes) =>
    api.post('/inventory/log', { siteId, materialId, type, quantity, notes }),

  // Get transaction history
  getLogs: (siteId, params) =>
    api.get('/inventory/logs', { params: { siteId, ...params } }),

  // Manager: get low stock alerts
  getLowStockAlerts: (siteId) =>
    api.get('/inventory/alerts', { params: { siteId } }),

  // Get material list
  getMaterials: (siteId) =>
    api.get('/inventory/materials', { params: { siteId } }),
};
