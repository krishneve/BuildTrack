import api from './api';
export const engineerService = {
  getHome:       (siteId) => api.get('/engineer/home', { params: { siteId } }),
  getStock:      (siteId) => api.get('/engineer/stock', { params: { siteId } }),
  getMyLogs:     (siteId, days = 7) => api.get('/engineer/my-logs', { params: { siteId, days } }),
  getMyInvoices: (siteId, page = 1) => api.get('/engineer/my-invoices', { params: { siteId, page } }),
  markAttendance: (data) => api.post('/engineer/attendance', data),
  materialIn:    (data) => api.post('/engineer/material-in', data),
  materialOut:   (data) => api.post('/engineer/material-out', data),
  uploadInvoice: (formData) => api.post('/engineer/invoice', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  addMaterial:   (data) => api.post('/engineer/add-material', data),
  detectMaterial: (image) => api.post('/ai/detect-material', { image }),
};
