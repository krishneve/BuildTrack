import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSites } from '../../hooks/useSites';
import { siteService } from '../../services/siteService';
import AdminLayout from '../../components/layout/AdminLayout';

const STATUS_OPTS = ['', 'active', 'planning', 'on_hold', 'completed', 'cancelled'];
const STATUS_COLORS = {
  active: 'bg-green-500/20 text-green-400 border-green-500/30',
  planning: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  on_hold: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  completed: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export default function SiteManagement() {
  const [filters, setFilters] = useState({ status: '', search: '' });
  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const { sites, loading, error, refetch } = useSites(filters);

  const handleDelete = async (id) => {
    if (!window.confirm('Archive this site? It will be hidden but data is preserved.')) return;
    setDeleting(id);
    try {
      await siteService.delete(id);
      refetch();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete site');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Site Management</h1>
            <p className="text-slate-500 text-sm mt-0.5">Manage all construction sites</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
          >
            + Add Site
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Search sites..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 w-64"
          />
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
          >
            {STATUS_OPTS.map((s) => (
              <option key={s} value={s}>{s ? s.replace('_', ' ') : 'All Statuses'}</option>
            ))}
          </select>
          <button onClick={refetch} className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-white text-sm">
            ↻ Refresh
          </button>
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-16 text-slate-500">Loading sites...</div>
        ) : error ? (
          <div className="text-center py-16 text-red-400">{error}</div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-xs text-slate-500 uppercase tracking-wider">
                  <th className="text-left px-5 py-3">Site</th>
                  <th className="text-left px-5 py-3">Location</th>
                  <th className="text-left px-5 py-3">Manager</th>
                  <th className="text-left px-5 py-3">Status</th>
                  <th className="text-left px-5 py-3">Architect</th>
                  <th className="text-left px-5 py-3">Progress</th>
                  <th className="text-left px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sites.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-600">No sites found</td>
                  </tr>
                ) : sites.map((site) => (
                  <tr key={site._id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-medium text-white">{site.name}</div>
                      <div className="text-xs text-slate-500 font-mono">{site.siteCode}</div>
                    </td>
                    <td className="px-5 py-4 text-slate-400">
                      {site.location?.city}
                    </td>
                    <td className="px-5 py-4 text-slate-400">
                      {site.manager?.name || <span className="text-slate-600 italic">Unassigned</span>}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${STATUS_COLORS[site.status] || ''}`}>
                        {site.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-400 text-xs">
                       {site.architects?.length > 0 ? (
                         <div className="flex flex-col gap-1">
                           {site.architects.map(a => (
                             <div key={a._id} className="font-bold text-white flex items-center gap-1">
                               <span className="text-amber-500">✎</span> {a.name}
                             </div>
                           ))}
                         </div>
                       ) : <span className="text-slate-700 italic">None</span>}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-800 rounded-full h-1.5 w-16">
                          <div
                            className="h-1.5 rounded-full bg-amber-500"
                            style={{ width: `${site.metrics?.progressPercent || 0}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-500">{site.metrics?.progressPercent || 0}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/admin/sites/${site._id}`}
                          className="text-xs text-amber-400 hover:text-amber-300"
                        >
                          View
                        </Link>
                        <Link
                          to={`/admin/sites/${site._id}/edit`}
                          className="text-xs text-slate-400 hover:text-white"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(site._id)}
                          disabled={deleting === site._id}
                          className="text-xs text-slate-600 hover:text-red-400 disabled:opacity-50"
                        >
                          Archive
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Site Modal */}
      {showForm && <SiteFormModal onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); refetch(); }} />}
    </AdminLayout>
  );
}

function SiteFormModal({ onClose, onSaved }) {
  const [form, setForm] = useState({
    name: '', projectType: 'residential', description: '',
    startDate: '', expectedEndDate: '',
    location: { address: '', city: 'Nashik', state: 'Maharashtra', pincode: '' },
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));
  const setLoc = (field, val) => setForm(f => ({ ...f, location: { ...f.location, [field]: val } }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await siteService.create(form);
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create site');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <h2 className="text-lg font-semibold text-white">Add New Site</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">{error}</div>}

          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Site Name *</label>
            <input
              value={form.name} onChange={e => set('name', e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
              placeholder="e.g. Samarth Residency Phase 2"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Project Type *</label>
              <select
                value={form.projectType} onChange={e => set('projectType', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
              >
                {['residential', 'commercial', 'infrastructure', 'industrial', 'mixed_use'].map(t => (
                  <option key={t} value={t}>{t.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Pincode</label>
              <input
                value={form.location.pincode} onChange={e => setLoc('pincode', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
                placeholder="422001"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Address *</label>
            <input
              value={form.location.address} onChange={e => setLoc('address', e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
              placeholder="Plot No. 12, Near Gangapur Road"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Start Date *</label>
              <input
                type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Expected End Date *</label>
              <input
                type="date" value={form.expectedEndDate} onChange={e => set('expectedEndDate', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Description</label>
            <textarea
              value={form.description} onChange={e => set('description', e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500 resize-none"
              rows={3}
              placeholder="Brief project description..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-slate-800 text-slate-400 rounded-lg text-sm hover:bg-slate-700">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-lg text-sm disabled:opacity-50">
              {saving ? 'Creating...' : 'Create Site'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
