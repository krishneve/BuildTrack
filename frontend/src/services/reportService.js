import api from './api';

const downloadPDF = async (url, filename) => {
  const response = await api.get(url, { responseType: 'blob' });
  const blob = new Blob([response.data], { type: 'application/pdf' });
  const link = document.createElement('a');
  link.href  = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
};

export const reportService = {
  downloadSiteSummary:     (siteId) => downloadPDF(`/reports/site-summary?siteId=${siteId}`, `site-summary-${siteId}.pdf`),
  downloadPaymentRegister: (siteId, from, to) => {
    const q = new URLSearchParams({ siteId, ...(from && { from }), ...(to && { to }) });
    return downloadPDF(`/reports/payment-register?${q}`, `payments-${siteId}.pdf`);
  },
  downloadInvoiceSummary:  (siteId) => downloadPDF(`/reports/invoice-summary?siteId=${siteId}`, `invoices-${siteId}.pdf`),
};
