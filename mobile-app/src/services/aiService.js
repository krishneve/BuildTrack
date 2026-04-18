import api from './api';
export const aiService = {
  getDashboard:   (siteId) => api.get(`/ai/dashboard/${siteId}`),
  getAlerts:      (siteId) => api.get(`/ai/smart-alerts/${siteId}`),
  getCostOverrun: (siteId) => api.get(`/ai/cost-overrun/${siteId}`),
  getForecast:    (siteId) => api.get(`/ai/predict-material/${siteId}`),
  getAnomaly:     (siteId, days = 30) => api.get(`/ai/anomaly/${siteId}?days=${days}`),
};
