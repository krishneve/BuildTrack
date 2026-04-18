import api from './api';
export const userService = {
  getAll: (params) => api.get('/admin/users', { params }),
  getUnassigned: (role) => api.get('/admin/users/unassigned', { params: { role } }),
  create: (data) => api.post('/admin/users', data),
  update: (id, data) => api.put(`/admin/users/${id}`, data),
  deactivate: (id) => api.delete(`/admin/users/${id}`),
};
