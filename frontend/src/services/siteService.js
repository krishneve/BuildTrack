import api from './api';
export const siteService = {
  getAll: (params) => api.get('/admin/sites', { params }),
  getById: (id) => api.get(`/admin/sites/${id}`),
  create: (data) => api.post('/admin/sites', data),
  update: (id, data) => api.put(`/admin/sites/${id}`, data),
  delete: (id) => api.delete(`/admin/sites/${id}`),
  assignManager: (id, managerId) => api.post(`/admin/sites/${id}/assign-manager`, { managerId }),
  assignEngineers: (id, engineerIds) => api.post(`/admin/sites/${id}/assign-engineers`, { engineerIds }),
};
