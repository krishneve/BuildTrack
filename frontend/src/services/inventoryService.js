import api from './api';
export const inventoryService = {
  getStock:        (siteId) => api.get('/inventory', { params: { siteId } }),
  getMaterials:    (siteId) => api.get('/inventory/materials', { params: { siteId } }),
  createMaterial:  (data)   => api.post('/inventory/materials', data),
  logMaterial:     (data)   => api.post('/inventory/log', data),
  getLogs:         (params) => api.get('/inventory/logs', { params }),
  getLowStockAlerts: (siteId) => api.get('/inventory/alerts', { params: { siteId } }),
  getSummary:      (siteId) => api.get('/inventory/summary', { params: { siteId } }),
};
