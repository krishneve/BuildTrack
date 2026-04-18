// services/engineerService.js
// All engineer-specific API calls — single source of truth for the field role

import api from './api';

export const engineerService = {

  /** Single call for everything the Home screen needs */
  getHome: (siteId) =>
    api.get('/engineer/home', { params: { siteId } }),

  /** Material stock list with low-stock flags */
  getStock: (siteId) =>
    api.get('/engineer/stock', { params: { siteId } }),

  /** Today's activity logs by this engineer */
  getMyLogs: (siteId, days = 7) =>
    api.get('/engineer/my-logs', { params: { siteId, days } }),

  /** This engineer's invoices for the site */
  getMyInvoices: (siteId) =>
    api.get('/engineer/my-invoices', { params: { siteId } }),

  /** Mark check-in or check-out */
  markAttendance: (siteId, type, notes = '', offlineId = null) =>
    api.post('/engineer/attendance', { siteId, type, notes, offlineId }),

  /** Log material received at site */
  materialIn: ({ siteId, materialId, quantity, supplier = '', notes = '', offlineId = null }) =>
    api.post('/engineer/material-in', { siteId, materialId, quantity, supplier, notes, offlineId }),

  /** Log material consumed on site */
  materialOut: ({ siteId, materialId, quantity, purpose = '', notes = '', offlineId = null }) =>
    api.post('/engineer/material-out', { siteId, materialId, quantity, purpose, notes, offlineId }),

  /** Upload supplier invoice (multipart form data) */
  uploadInvoice: (siteId, formData) =>
    api.post('/engineer/invoice', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      params: { siteId },
    }),

  /** Plain JSON invoice upload (no photo) */
  submitInvoice: (payload) =>
    api.post('/engineer/invoice', payload),
};
