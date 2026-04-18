import api from './api';
export const paymentService = {
  getAll:     (params)  => api.get('/payments', { params }),
  getPending: (siteId)  => api.get('/payments/pending', { params: { siteId } }),
  getSummary: (siteId)  => api.get('/payments/summary', { params: { siteId } }),
  create:     (data)    => api.post('/payments', data),
  approve:    (id, remarks) => api.put(`/payments/${id}/approve`, { remarks }),
  reject:     (id, reason)  => api.put(`/payments/${id}/reject`, { reason }),
};
