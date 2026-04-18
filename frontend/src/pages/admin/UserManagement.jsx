import React, { useState, useEffect } from 'react';
import { userService } from '../../services/userService';
import AdminLayout from '../../components/layout/AdminLayout';

const ROLES = ['admin', 'site_manager', 'site_engineer'];
const ROLE_LABELS = { admin: 'Admin', site_manager: 'Site Manager', site_engineer: 'Site Engineer' };
const ROLE_COLORS = {
  admin: 'bg-amber-500/20 text-amber-400',
  site_manager: 'bg-blue-500/20 text-blue-400',
  site_engineer: 'bg-green-500/20 text-green-400',
};

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ role: '', search: '' });
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState(null);

  const fetchUsers = React.useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await userService.getAll(filters);
      setUsers(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters]); 

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleDeactivate = async (id, name) => {
    if (!window.confirm(`Deactivate ${name}? They will lose system access.`)) return;
    try {
      await userService.deactivate(id);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to deactivate user');
    }
  };

  const filtered = filters.search
    ? users.filter(u => u.name.toLowerCase().includes(filters.search.toLowerCase()) || u.email.toLowerCase().includes(filters.search.toLowerCase()))
    : users;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">User Management</h1>
            <p className="text-slate-500 text-sm mt-0.5">Manage staff and role assignments</p>
          </div>
          <button
            onClick={() => { setEditUser(null); setShowForm(true); }}
            className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold px-4 py-2 rounded-lg text-sm"
          >
            + Add User
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={filters.search}
            onChange={e => setFilters({ ...filters, search: e.target.value })}
            className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 w-64"
          />
          <select
            value={filters.role}
            onChange={e => setFilters({ ...filters, role: e.target.value })}
            className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
          >
            <option value="">All Roles</option>
            {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
          </select>
        </div>

        {/* Role summary cards */}
        <div className="grid grid-cols-3 gap-4">
          {ROLES.map(role => (
            <div key={role} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">{ROLE_LABELS[role]}</div>
              <div className="text-2xl font-bold text-white">
                {users.filter(u => u.role === role).length}
              </div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-xs text-slate-500 uppercase tracking-wider">
                <th className="text-left px-5 py-3">Name</th>
                <th className="text-left px-5 py-3">Email</th>
                <th className="text-left px-5 py-3">Role</th>
                <th className="text-left px-5 py-3">Assigned Sites</th>
                <th className="text-left px-5 py-3">Status</th>
                <th className="text-left px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-12 text-slate-600">Loading users...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-slate-600">No users found</td></tr>
              ) : filtered.map(user => (
                <tr key={user._id} className="border-b border-slate-800/50 hover:bg-slate-800/20">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center text-xs font-bold text-amber-400">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-white">{user.name}</div>
                        {user.designation && <div className="text-xs text-slate-500">{user.designation}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-400 text-xs font-mono">{user.email}</td>
                  <td className="px-5 py-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${ROLE_COLORS[user.role] || ''}`}>
                      {ROLE_LABELS[user.role] || user.role}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-400 text-xs">
                    {user.assignedSites?.length > 0
                      ? user.assignedSites.map(s => s.name || s.siteCode).join(', ')
                      : <span className="text-slate-600">None</span>}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${user.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setEditUser(user); setShowForm(true); }}
                        className="text-xs text-amber-400 hover:text-amber-300"
                      >Edit</button>
                      {user.isActive && (
                        <button
                          onClick={() => handleDeactivate(user._id, user.name)}
                          className="text-xs text-slate-600 hover:text-red-400"
                        >Deactivate</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <UserFormModal
          user={editUser}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); fetchUsers(); }}
        />
      )}
    </AdminLayout>
  );
}

function UserFormModal({ user, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    password: '',
    role: user?.role || 'site_engineer',
    designation: user?.designation || '',
    employeeId: user?.employeeId || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const isEdit = !!user;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = { ...form };
      if (isEdit && !payload.password) delete payload.password;
      if (isEdit) await userService.update(user._id, payload);
      else await userService.create(payload);
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save user');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <h2 className="text-lg font-semibold text-white">{isEdit ? 'Edit User' : 'Add New User'}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">{error}</div>}

          {[
            { key: 'name', label: 'Full Name', type: 'text', placeholder: 'Rajesh Sharma', required: true },
            { key: 'email', label: 'Email', type: 'email', placeholder: 'rajesh@samarthdevelopers.com', required: !isEdit },
            { key: 'phone', label: 'Phone', type: 'tel', placeholder: '9876543210' },
            { key: 'password', label: isEdit ? 'New Password (leave blank to keep)' : 'Password', type: 'password', required: !isEdit },
            { key: 'designation', label: 'Designation', type: 'text', placeholder: 'Senior Site Engineer' },
            { key: 'employeeId', label: 'Employee ID', type: 'text', placeholder: 'SD-EMP-001' },
          ].map(({ key, label, type, placeholder, required }) => (
            <div key={key}>
              <label className="block text-xs text-slate-400 mb-1.5">{label}</label>
              <input
                type={type}
                value={form[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
                placeholder={placeholder}
                required={required}
              />
            </div>
          ))}

          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Role *</label>
            <select
              value={form.role}
              onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
            >
              {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-slate-800 text-slate-400 rounded-lg text-sm">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-lg text-sm disabled:opacity-50">
              {saving ? 'Saving...' : isEdit ? 'Update User' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
