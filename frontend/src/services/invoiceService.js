import api from './api';
export const invoiceService = {
  getAll:     (params)  => api.get('/invoices', { params }),
  getById:    (id)      => api.get(`/invoices/${id}`),
  getSummary: (siteId)  => api.get('/invoices/summary', { params: { siteId } }),
  upload:     (data)    => api.post('/invoices/upload', data),
  updateStatus: (id, status, remarks) => api.put(`/invoices/${id}/status`, { status, remarks }),
};
