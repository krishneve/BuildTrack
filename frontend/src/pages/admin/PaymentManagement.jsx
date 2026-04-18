import React, { useState, useEffect } from 'react';
import { paymentService } from '../../services/paymentService';
import { siteService } from '../../services/siteService';
import AdminLayout from '../../components/layout/AdminLayout';

const STATUS_STYLES = {
  pending:  'bg-yellow-500/20 text-yellow-400',
  approved: 'bg-green-500/20 text-green-400',
  rejected: 'bg-red-500/20 text-red-400',
  paid:     'bg-blue-500/20 text-blue-400',
};
const TYPE_LABELS = {
  weekly_labor: 'Weekly Labor', monthly_salary: 'Monthly Salary',
  advance: 'Advance', bonus: 'Bonus', contractor: 'Contractor', other: 'Other',
};

function fmtINR(n) { return `₹${Number(n||0).toLocaleString('en-IN')}`; }

export default function PaymentManagement() {
  const [sites, setSites]       = useState([]);
  const [siteId, setSiteId]     = useState('');
  const [payments, setPayments] = useState([]);
  const [summary, setSummary]   = useState(null);
  const [filter, setFilter]     = useState('');
  const [showAdd, setShowAdd]   = useState(false);
  const [processing, setProcessing] = useState(null);
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    siteService.getAll({ limit: 100 }).then(({ data }) => {
      setSites(data.data || []);
      if (data.data?.length) setSiteId(data.data[0]._id);
    });
  }, []);

  const fetchAll = React.useCallback(() => {
    if (!siteId) return;
    setLoading(true);
    Promise.all([
      paymentService.getAll({ siteId, status: filter || undefined, limit: 100 }),
      paymentService.getSummary(siteId),
    ]).then(([p, s]) => {
      setPayments(p.data.data || []);
      setSummary(s.data.data);
    }).finally(() => setLoading(false));
  }, [siteId, filter]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleApprove = async (id) => {
    setProcessing(id);
    try {
      await paymentService.approve(id);
      fetchAll();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (id) => {
    const reason = prompt('Reason for rejection?');
    if (!reason) return;
    setProcessing(id);
    try {
      await paymentService.reject(id, reason);
      fetchAll();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    } finally {
      setProcessing(null);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Payment Management</h1>
            <p className="text-slate-500 text-sm mt-0.5">Worker payments and contractor bills</p>
          </div>
          <div className="flex gap-2">
            <select value={siteId} onChange={e => setSiteId(e.target.value)} className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500">
              {sites.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>
            <button onClick={() => setShowAdd(true)} className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold px-4 py-2 rounded-lg text-sm">+ Payment</button>
          </div>
        </div>

        {/* Summary cards */}
        {summary && (
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Pending', value: summary.pending, alert: summary.pending > 0 },
              { label: 'Total Approved', value: summary.approved },
              { label: 'Total Paid Out', value: fmtINR(summary.totalPaid) },
              { label: 'Total Records', value: summary.total },
            ].map(c => (
              <div key={c.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">{c.label}</div>
                <div className={`text-2xl font-bold ${c.alert ? 'text-amber-400' : 'text-white'}`}>{c.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Payment type breakdown */}
        {summary?.byType?.some(t => t.amount > 0) && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-3">By Payment Type</div>
            <div className="flex gap-6 flex-wrap">
              {summary.byType.filter(t => t.amount > 0).map(t => (
                <div key={t.type} className="text-center">
                  <div className="text-lg font-bold text-white">{fmtINR(t.amount)}</div>
                  <div className="text-xs text-slate-500">{TYPE_LABELS[t.type]} ({t.count})</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-2">
          {['', 'pending', 'approved', 'rejected', 'paid'].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize ${filter === s ? 'bg-amber-500 text-slate-900' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'}`}>
              {s || 'All'}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-xs text-slate-500 uppercase tracking-wider">
                <th className="text-left px-5 py-3">Payee</th>
                <th className="text-left px-5 py-3">Type</th>
                <th className="text-right px-5 py-3">Amount</th>
                <th className="text-left px-5 py-3">Period</th>
                <th className="text-left px-5 py-3">Method</th>
                <th className="text-left px-5 py-3">Status</th>
                <th className="text-left px-5 py-3">Date</th>
                <th className="text-left px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-12 text-slate-500">Loading...</td></tr>
              ) : payments.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-slate-600">No payments found</td></tr>
              ) : payments.map(p => (
                <tr key={p._id} className="border-b border-slate-800/50 hover:bg-slate-800/20">
                  <td className="px-5 py-3">
                    <div className="font-medium text-white">{p.payeeName}</div>
                    <div className="text-xs text-slate-500 capitalize">{p.payeeType}</div>
                  </td>
                  <td className="px-5 py-3 text-slate-400 text-xs">{TYPE_LABELS[p.type] || p.type}</td>
                  <td className="px-5 py-3 text-right font-semibold text-white">{fmtINR(p.amount)}</td>
                  <td className="px-5 py-3 text-slate-400 text-xs">{p.period || '—'}</td>
                  <td className="px-5 py-3 text-slate-400 text-xs capitalize">{p.method}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${STATUS_STYLES[p.status] || ''}`}>{p.status}</span>
                    {p.reason && <div className="text-xs text-slate-500 mt-1 italic">"{p.reason}"</div>}
                  </td>
                  <td className="px-5 py-3 text-slate-400 text-xs">{new Date(p.createdAt).toLocaleDateString('en-IN')}</td>
                  <td className="px-5 py-3">
                    {p.status === 'pending' && (
                      <div className="flex gap-2">
                        <button onClick={() => handleApprove(p._id)} disabled={processing === p._id}
                          className="text-xs text-green-400 hover:text-green-300 disabled:opacity-40">Approve</button>
                        <button onClick={() => handleReject(p._id)} disabled={processing === p._id}
                          className="text-xs text-red-400 hover:text-red-300 disabled:opacity-40">Reject</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAdd && <AddPaymentModal siteId={siteId} onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); fetchAll(); }} />}
    </AdminLayout>
  );
}

function AddPaymentModal({ siteId, onClose, onSaved }) {
  const [form, setForm] = useState({ payeeName: '', payeeType: 'worker', type: 'weekly_labor', amount: '', period: '', method: 'cash', notes: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await paymentService.create({ ...form, siteId, amount: Number(form.amount) });
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
          <h2 className="font-semibold text-white">Create Payment</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          {error && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">{error}</div>}
          {[
            { key: 'payeeName', label: 'Payee Name *', placeholder: 'Ramesh Kumar' },
            { key: 'amount', label: 'Amount (₹) *', placeholder: '5000', type: 'number' },
            { key: 'period', label: 'Period', placeholder: 'Week 1 Apr 2025' },
            { key: 'notes', label: 'Notes', placeholder: 'Optional details' },
          ].map(({ key, label, placeholder, type }) => (
            <div key={key}>
              <label className="block text-xs text-slate-400 mb-1">{label}</label>
              <input type={type || 'text'} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500"
                placeholder={placeholder} required={label.includes('*')} />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: 'payeeType', label: 'Payee Type', opts: ['worker','staff','contractor','vendor'] },
              { key: 'type', label: 'Payment Type', opts: ['weekly_labor','monthly_salary','advance','bonus','contractor','other'] },
              { key: 'method', label: 'Method', opts: ['cash','bank_transfer','upi','cheque'] },
            ].map(({ key, label, opts }) => (
              <div key={key}>
                <label className="block text-xs text-slate-400 mb-1">{label}</label>
                <select value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500">
                  {opts.map(o => <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
            ))}
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2 bg-slate-800 text-slate-400 rounded-lg text-sm">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-lg text-sm disabled:opacity-50">{saving ? 'Creating...' : 'Create Payment'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
