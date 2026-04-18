import React, { useState, useEffect } from 'react';
import ManagerLayout from '../../components/layout/ManagerLayout';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const TRADE_EMOJI = { mason:'🧱', carpenter:'🪵', electrician:'⚡', plumber:'🔧', welder:'🔥', helper:'👷', painter:'🎨', supervisor:'📋', driver:'🚗', other:'👤' };
const TRADES = Object.keys(TRADE_EMOJI);

export default function ManagerWorkersPage() {
  const { user } = useAuth();
  const siteId = user?.primarySite?._id || user?.primarySite;

  const [workers, setWorkers] = useState([]);
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [trade,   setTrade]   = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);

  const fetchAll = React.useCallback(() => {
    if (!siteId) return;
    setLoading(true);
    Promise.all([
      api.get('/workers', { params: { siteId, trade: trade || undefined } }),
      api.get('/workers/stats', { params: { siteId } }),
    ]).then(([w, s]) => {
      setWorkers(w.data.data || []);
      setStats(s.data.data);
    }).finally(() => setLoading(false));
  }, [siteId, trade]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const filtered = search ? workers.filter(w => w.name.toLowerCase().includes(search.toLowerCase())) : workers;

  const deactivate = async (id, name) => {
    if (!window.confirm(`Remove ${name} from site?`)) return;
    await api.delete(`/workers/${id}`);
    fetchAll();
  };

  return (
    <ManagerLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Workers</h1>
            {stats && <p className="text-slate-500 text-sm mt-0.5">{stats.total} active · Est. ₹{(stats.estimatedWeeklyBill / 1000).toFixed(0)}K/week</p>}
          </div>
          <button onClick={() => { setEditing(null); setShowAdd(true); }} className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold px-4 py-2 rounded-lg text-sm transition-colors">+ Add Worker</button>
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <input
            type="text" placeholder="Search workers..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 w-56"
          />
          <div className="flex gap-1.5 flex-wrap">
            {['', ...TRADES].map(t => (
              <button key={t || 'all'} onClick={() => setTrade(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors capitalize ${trade === t ? 'bg-amber-500 text-slate-900' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'}`}>
                {t ? `${TRADE_EMOJI[t]} ${t}` : 'All'}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-xs text-slate-500 uppercase tracking-wider">
                <th className="text-left px-5 py-3">Worker</th>
                <th className="text-left px-5 py-3">Trade</th>
                <th className="text-left px-5 py-3">Contact</th>
                <th className="text-left px-5 py-3">Wage</th>
                <th className="text-left px-5 py-3">Since</th>
                <th className="text-left px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-12 text-slate-500">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-slate-600">No workers found</td></tr>
              ) : filtered.map(w => (
                <tr key={w._id} className="border-b border-slate-800/50 hover:bg-slate-800/20">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{TRADE_EMOJI[w.trade] || '👷'}</span>
                      <div>
                        <div className="font-medium text-white">{w.name}</div>
                        {w.notes && <div className="text-xs text-slate-500">{w.notes}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-slate-400 capitalize">{w.trade}</td>
                  <td className="px-5 py-3 text-slate-400 text-xs">{w.phone || '—'}</td>
                  <td className="px-5 py-3">
                    <div className="text-green-400 font-semibold">₹{w.wageAmount.toLocaleString()}</div>
                    <div className="text-xs text-slate-500">{w.wageType.replace('_', ' ')}</div>
                  </td>
                  <td className="px-5 py-3 text-slate-400 text-xs">{new Date(w.joinDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                  <td className="px-5 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => { setEditing(w); setShowAdd(true); }} className="text-xs text-amber-400 hover:text-amber-300">Edit</button>
                      <button onClick={() => deactivate(w._id, w.name)} className="text-xs text-slate-600 hover:text-red-400">Remove</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAdd && <WorkerModal worker={editing} siteId={siteId} onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); fetchAll(); }} />}
    </ManagerLayout>
  );
}

function WorkerModal({ worker, siteId, onClose, onSaved }) {
  const isEdit = !!worker;
  const [form, setForm] = useState({ name: worker?.name||'', phone: worker?.phone||'', trade: worker?.trade||'mason', wageType: worker?.wageType||'per_day', wageAmount: worker?.wageAmount||'', employmentType: worker?.employmentType||'daily', notes: worker?.notes||'' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const payload = { ...form, wageAmount: Number(form.wageAmount), siteId };
      if (isEdit) await api.put(`/workers/${worker._id}`, payload);
      else        await api.post('/workers', payload);
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <h2 className="font-semibold text-white">{isEdit ? 'Edit Worker' : 'Add Worker'}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          {error && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">{error}</div>}
          {[
            { key: 'name', label: 'Full Name *', placeholder: 'Ramesh Kumar', required: true },
            { key: 'phone', label: 'Phone', placeholder: '9876543210' },
            { key: 'wageAmount', label: 'Wage Amount (₹) *', placeholder: '600', type: 'number', required: true },
            { key: 'notes', label: 'Notes', placeholder: 'Optional' },
          ].map(({ key, label, placeholder, type, required }) => (
            <div key={key}>
              <label className="block text-xs text-slate-400 mb-1">{label}</label>
              <input type={type || 'text'} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500"
                placeholder={placeholder} required={required} />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: 'trade', label: 'Trade', opts: TRADES },
              { key: 'wageType', label: 'Wage Type', opts: ['per_day','per_week','fixed_monthly'] },
              { key: 'employmentType', label: 'Employment', opts: ['daily','weekly','contract'] },
            ].map(({ key, label, opts }) => (
              <div key={key}>
                <label className="block text-xs text-slate-400 mb-1">{label}</label>
                <select value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500">
                  {opts.map(o => <option key={o} value={o}>{o.replace(/_/g,' ')}</option>)}
                </select>
              </div>
            ))}
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2 bg-slate-800 text-slate-400 rounded-lg text-sm">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-lg text-sm disabled:opacity-50">{saving ? 'Saving...' : isEdit ? 'Update' : 'Add Worker'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
