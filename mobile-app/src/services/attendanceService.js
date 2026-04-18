import api from './api';

export const attendanceService = {
  // Engineer: mark own attendance for today
  markAttendance: (siteId, type, notes) =>
    api.post('/attendance', { siteId, type, notes }),

  // Get today's attendance for a site
  getTodayAttendance: (siteId) =>
    api.get('/attendance/today', { params: { siteId } }),

  // Manager: get attendance list for approval
  getPendingApprovals: (siteId) =>
    api.get('/attendance/pending', { params: { siteId } }),

  // Manager: approve/reject
  updateStatus: (id, status, remarks) =>
    api.put(`/attendance/${id}/status`, { status, remarks }),

  // Engineer: get own history
  getMyHistory: (siteId, from, to) =>
    api.get('/attendance/my', { params: { siteId, from, to } }),

  // Get worker headcount summary
  getDailySummary: (siteId, date) =>
    api.get('/attendance/summary', { params: { siteId, date } }),
};
