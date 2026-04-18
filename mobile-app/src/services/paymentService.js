import api from './api';

export const paymentService = {
  // Manager: get pending payments
  getPending: (siteId) =>
    api.get('/payments/pending', { params: { siteId } }),

  // Manager: approve a payment
  approve: (id, remarks) =>
    api.put(`/payments/${id}/approve`, { remarks }),

  // Manager: reject a payment
  reject: (id, reason) =>
    api.put(`/payments/${id}/reject`, { reason }),

  // Get payment history
  getHistory: (siteId) =>
    api.get('/payments', { params: { siteId } }),

  // Manager: add manual payment
  create: (data) => api.post('/payments', data),
};
