import api from './api';

export const invoiceService = {
  // Engineer/Manager: upload invoice with photo
  uploadInvoice: async (siteId, formData) => {
    return api.post('/invoices/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      params: { siteId },
    });
  },

  // Get invoices for a site
  getInvoices: (siteId, status) =>
    api.get('/invoices', { params: { siteId, status } }),

  // Manager: approve / reject invoice
  updateStatus: (id, status, remarks) =>
    api.put(`/invoices/${id}/status`, { status, remarks }),

  // Get single invoice detail
  getById: (id) => api.get(`/invoices/${id}`),
};
