import React, { useState, useEffect } from 'react';
import { inventoryService } from '../../services/inventoryService';
import { siteService } from '../../services/siteService';
import AdminLayout from '../../components/layout/AdminLayout';

const CATEGORY_EMOJI = {
  cement:'🏗', steel:'⚙', bricks:'🧱', sand:'🟨', aggregate:'⬤',
  wood:'🪵', paint:'🎨', plumbing:'🔧', electrical:'⚡', safety:'⛑', other:'▦'
};

function fmt(n) {
  if (n >= 10000000) return `₹${(n/10000000).toFixed(2)}Cr`;
  if (n >= 100000)   return `₹${(n/100000).toFixed(2)}L`;
  return `₹${Number(n||0).toLocaleString()}`;
}

export default function InventoryManagement() {
  const [sites, setSites]       = useState([]);
  const [siteId, setSiteId]     = useState('all');
  const [stock, setStock]       = useState([]);
  const [summary, setSummary]   = useState(null);
  const [logs, setLogs]         = useState([]);
  const [tab, setTab]           = useState('stock');
  const [showAdd, setShowAdd]   = useState(false);
  const [showLog, setShowLog]   = useState(false);
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    siteService.getAll({ limit: 100 }).then(({ data }) => {
      setSites(data.data || []);
    });
  }, []);

  useEffect(() => {
    if (!siteId) return;
    setLoading(true);
    Promise.all([
      inventoryService.getStock(siteId),
      inventoryService.getSummary(siteId),
      inventoryService.getLogs({ siteId, limit: 50 }),
    ]).then(([s, sum, l]) => {
      setStock(s.data.data || []);
      setSummary(sum.data.data);
      setLogs(l.data.data || []);
    }).finally(() => setLoading(false));
  }, [siteId]);

  const refetch = () => {
    if (!siteId) return;
    Promise.all([inventoryService.getStock(siteId), inventoryService.getSummary(siteId), inventoryService.getLogs({ siteId, limit: 50 })]).then(([s, sum, l]) => {
      setStock(s.data.data || []);
      setSummary(sum.data.data);
      setLogs(l.data.data || []);
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Inventory Management</h1>
            <p className="text-slate-500 text-sm mt-0.5">Track materials across all sites</p>
          </div>
          <div className="flex gap-2">
            <select
              value={siteId}
              onChange={e => setSiteId(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 font-bold"
            >
              <option value="all">🌐 All Sites</option>
              {sites.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>
            <button onClick={() => setShowAdd(true)} className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold px-4 py-2 rounded-lg text-sm">+ Material</button>
            <button onClick={() => setShowLog(true)} className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm border border-slate-700">Log Entry</button>
          </div>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Total Items', value: summary.totalItems },
              { label: 'Low Stock', value: summary.lowStockCount, alert: summary.lowStockCount > 0 },
              { label: 'Stock Value', value: fmt(summary.totalValue) },
              { label: '7-Day IN / OUT', value: `${summary.last7Days?.in?.toFixed(0) || 0} / ${summary.last7Days?.out?.toFixed(0) || 0}` },
            ].map(c => (
              <div key={c.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">{c.label}</div>
                <div className={`text-2xl font-bold ${c.alert ? 'text-red-400' : 'text-white'}`}>{c.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1 w-fit">
          {['stock', 'logs'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded text-sm font-medium transition-colors capitalize
                ${tab === t ? 'bg-amber-500 text-slate-900' : 'text-slate-400 hover:text-white'}`}>
              {t === 'stock' ? 'Stock Levels' : 'Transaction Logs'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-16 text-slate-500">Loading...</div>
        ) : tab === 'stock' ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-xs text-slate-500 uppercase tracking-wider">
                  <th className="text-left px-5 py-3">Material</th>
                  <th className="text-left px-5 py-3">Category</th>
                  <th className="text-right px-5 py-3">Current Stock</th>
                  <th className="text-right px-5 py-3">Min Threshold</th>
                  <th className="text-right px-5 py-3">Unit Cost</th>
                  <th className="text-right px-5 py-3">Stock Value</th>
                  <th className="text-left px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {stock.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-12 text-slate-600">No materials found. Add materials to track inventory.</td></tr>
                ) : stock.map(m => (
                  <tr key={m._id} className={`border-b border-slate-800/50 hover:bg-slate-800/20 ${m.isLowStock ? 'bg-red-500/5' : ''}`}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{CATEGORY_EMOJI[m.category] || '▦'}</span>
                        <span className="font-medium text-white">{m.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-400 capitalize">{m.category}</td>
                    <td className="px-5 py-3 text-right font-mono">
                      <span className={m.isLowStock ? 'text-red-400 font-bold' : 'text-white'}>
                        {m.currentStock} {m.unit}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right text-slate-500">{m.minThreshold} {m.unit}</td>
                    <td className="px-5 py-3 text-right text-slate-400">₹{m.unitCost}/{m.unit}</td>
                    <td className="px-5 py-3 text-right text-amber-400 font-semibold">{fmt(m.stockValue)}</td>
                    <td className="px-5 py-3">
                      {m.isLowStock
                        ? <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-bold">LOW STOCK</span>
                        : <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">OK</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-xs text-slate-500 uppercase tracking-wider">
                  <th className="text-left px-5 py-3">Date</th>
                  <th className="text-left px-5 py-3">Material</th>
                  <th className="text-left px-5 py-3">Type</th>
                  <th className="text-right px-5 py-3">Qty</th>
                  <th className="text-right px-5 py-3">Balance</th>
                  <th className="text-left px-5 py-3">Logged By</th>
                  <th className="text-left px-5 py-3">Notes</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-12 text-slate-600">No transactions yet</td></tr>
                ) : logs.map(l => (
                  <tr key={l._id} className="border-b border-slate-800/50 hover:bg-slate-800/20">
                    <td className="px-5 py-3 text-slate-400 text-xs">{new Date(l.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                    <td className="px-5 py-3 text-white font-medium">{l.material?.name}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${l.type === 'in' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {l.type?.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-white">{l.quantity} {l.material?.unit}</td>
                    <td className="px-5 py-3 text-right text-slate-400">{l.balanceAfter} {l.material?.unit}</td>
                    <td className="px-5 py-3 text-slate-400 text-xs">{l.loggedBy?.name}</td>
                    <td className="px-5 py-3 text-slate-500 text-xs italic">{l.notes || l.supplier || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAdd && <AddMaterialModal siteId={siteId === 'all' ? (sites[0]?._id) : siteId} onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); refetch(); }} />}
      {showLog && <LogMaterialModal siteId={siteId === 'all' ? (sites[0]?._id) : siteId} stock={stock} onClose={() => setShowLog(false)} onSaved={() => { setShowLog(false); refetch(); }} />}
    </AdminLayout>
  );
}

function AddMaterialModal({ siteId, onClose, onSaved }) {
  const [form, setForm] = useState({ name: '', category: 'cement', unit: 'bags', minThreshold: 0, maxCapacity: '', unitCost: 0, emoji: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await inventoryService.createMaterial({ ...form, siteId });
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
          <h2 className="font-semibold text-white">Add Material to Catalogue</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          {error && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">{error}</div>}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs text-slate-400 mb-1">Name *</label>
              <input value={form.name} onChange={e => set('name', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500" placeholder="e.g. OPC Cement 53 Grade" required />
            </div>
            {[
              { key: 'category', label: 'Category', type: 'select', opts: ['cement','steel','bricks','sand','aggregate','wood','paint','plumbing','electrical','safety','other'] },
              { key: 'unit', label: 'Unit', type: 'select', opts: ['bags','kg','tonnes','pcs','litre','sqft','rmt','nos'] },
            ].map(({ key, label, type, opts }) => (
              <div key={key}>
                <label className="block text-xs text-slate-400 mb-1">{label}</label>
                <select value={form[key]} onChange={e => set(key, e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500">
                  {opts.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            ))}
            {[
              { key: 'minThreshold', label: 'Min Threshold', placeholder: '50' },
              { key: 'maxCapacity', label: 'Max Capacity', placeholder: '500' },
              { key: 'unitCost', label: 'Unit Cost (₹)', placeholder: '350' },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="block text-xs text-slate-400 mb-1">{label}</label>
                <input type="number" value={form[key]} onChange={e => set(key, e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500" placeholder={placeholder} />
              </div>
            ))}
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2 bg-slate-800 text-slate-400 rounded-lg text-sm">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-lg text-sm disabled:opacity-50">{saving ? 'Adding...' : 'Add Material'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function LogMaterialModal({ siteId, stock, onClose, onSaved }) {
  const [form, setForm] = useState({ materialId: stock[0]?._id || '', type: 'in', quantity: '', notes: '', supplier: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await inventoryService.logMaterial({ siteId, ...form, quantity: Number(form.quantity) });
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
          <h2 className="font-semibold text-white">Log Material Entry</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          {error && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">{error}</div>}
          <div>
            <label className="block text-xs text-slate-400 mb-1">Material *</label>
            <select value={form.materialId} onChange={e => setForm(f => ({ ...f, materialId: e.target.value }))} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500" required>
              {stock.map(m => <option key={m._id} value={m._id}>{m.name} (Stock: {m.currentStock} {m.unit})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500">
                <option value="in">IN (Received)</option>
                <option value="out">OUT (Used)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Quantity *</label>
              <input type="number" min="0.01" step="0.01" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500" required />
            </div>
          </div>
          {form.type === 'in' && (
            <div>
              <label className="block text-xs text-slate-400 mb-1">Supplier</label>
              <input value={form.supplier} onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500" placeholder="Supplier name" />
            </div>
          )}
          <div>
            <label className="block text-xs text-slate-400 mb-1">Notes</label>
            <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500" placeholder="Optional notes" />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2 bg-slate-800 text-slate-400 rounded-lg text-sm">Cancel</button>
            <button type="submit" disabled={saving} className={`flex-1 py-2 font-semibold rounded-lg text-sm disabled:opacity-50 ${form.type === 'in' ? 'bg-green-500 hover:bg-green-400 text-white' : 'bg-red-500 hover:bg-red-400 text-white'}`}>{saving ? 'Logging...' : `Log ${form.type.toUpperCase()}`}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
