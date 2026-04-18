import api from './api';

export const workerService = {
  getAll:   (siteId, params) => api.get('/workers', { params: { siteId, ...params } }),
  getById:  (id, siteId)     => api.get(`/workers/${id}`, { params: { siteId } }),
  getStats: (siteId)         => api.get('/workers/stats', { params: { siteId } }),
  create:   (data)           => api.post('/workers', data),
  update:   (id, data)       => api.put(`/workers/${id}`, data),
  remove:   (id)             => api.delete(`/workers/${id}`),
  createPayment: (id, data)  => api.post(`/workers/${id}/payment`, data),
};
