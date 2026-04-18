import React, { useState, useEffect } from 'react';
import ManagerLayout from '../../components/layout/ManagerLayout';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const STATUS_STYLE = {
  pending:  'bg-amber-500/20 text-amber-500 border-amber-500/30',
  approved: 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30',
  paid:     'bg-blue-500/20 text-blue-500 border-blue-500/30',
  rejected: 'bg-red-500/20 text-red-500 border-red-500/30',
};

export default function ManagerPayments() {
  const { user } = useAuth();
  const siteId = user?.primarySite?._id || user?.primarySite;
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchPayments = React.useCallback(() => {
    if (!siteId) return;
    setLoading(true);
    api.get(`/payments`, { params: { siteId } })
      .then(r => setPayments(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [siteId]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  const handleAction = async (id, action) => {
    setActionLoading(id);
    try {
      await api.put(`/payments/${id}/${action}`);
      fetchPayments();
    } catch (err) {
      alert('Action failed: ' + (err.response?.data?.message || 'Error'));
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <ManagerLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-5">
          <div>
            <h1 className="text-2xl font-bold text-white">Payment Management</h1>
            <p className="text-slate-500 text-sm mt-0.5">Track site expenditures and worker payouts</p>
          </div>
          <button onClick={() => setShowAdd(true)} className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold px-5 py-2.5 rounded-lg shadow-lg shadow-amber-500/10 transition-all active:scale-95 flex items-center gap-2 text-sm">
            <span className="text-xl leading-none">+</span> New Request
          </button>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => <div key={i} className="h-28 bg-slate-900/50 rounded-xl animate-pulse border border-slate-800"></div>)}
          </div>
        ) : payments.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-20 text-center">
            <h3 className="text-slate-600 font-medium">No payment records found for this site.</h3>
          </div>
        ) : (
          <div className="grid gap-4">
            {payments.map(p => (
              <div key={p._id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-600 transition-all group">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-slate-800 rounded-xl flex items-center justify-center text-3xl shadow-inner group-hover:scale-105 transition-all">
                      {p.payeeType === 'worker' ? '👷' : '🏢'}
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-lg text-white group-hover:text-amber-400 transition-colors uppercase">{p.payeeName}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${STATUS_STYLE[p.status]}`}>
                          {p.status}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-2 font-bold flex flex-wrap items-center gap-3 uppercase tracking-wider">
                        <span className="text-blue-400">{p.type?.replace(/_/g, ' ')}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                        <span>{p.period}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                        <span className="opacity-80 italic">{p.method?.replace(/_/g, ' ')}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between lg:justify-end gap-10">
                    <div className="lg:text-right">
                      <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Amount</div>
                      <div className="text-2xl font-bold text-white">₹{p.amount.toLocaleString()}</div>
                    </div>
                    
                    {p.status === 'pending' && (
                       <div className="flex gap-2">
                         <button 
                           onClick={() => handleAction(p._id, 'approve')}
                           disabled={actionLoading === p._id}
                           className="w-10 h-10 bg-emerald-500/10 text-emerald-500 rounded-lg flex items-center justify-center border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-all shadow-lg active:scale-95"
                           title="Approve"
                         >
                           ✓
                         </button>
                         <button 
                           onClick={() => handleAction(p._id, 'reject')}
                           disabled={actionLoading === p._id}
                           className="w-10 h-10 bg-red-500/10 text-red-500 rounded-lg flex items-center justify-center border border-red-500/20 hover:bg-red-500 hover:text-white transition-all shadow-lg active:scale-95"
                           title="Reject"
                         >
                           ✕
                         </button>
                       </div>
                    )}
                    
                    {p.status !== 'pending' && (
                      <div className="text-right hidden sm:block">
                        <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Updated At</div>
                        <div className="text-xs text-slate-400">{new Date(p.updatedAt).toLocaleDateString()}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAdd && <PaymentModal siteId={siteId} onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); fetchPayments(); }} />}
    </ManagerLayout>
  );
}

function PaymentModal({ siteId, onClose, onSaved }) {
  const [form, setForm] = useState({ payeeName: '', amount: '', type: 'weekly_labor', period: '', method: 'cash', notes: '', payeeType: 'worker' });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/payments', { ...form, siteId });
      onSaved();
    } catch (err) {
      alert('Failed to create payment: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-fade">
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-white uppercase italic tracking-tight">New Payout Request</h2>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Authorized project expenditure</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 bg-slate-800 flex items-center justify-center rounded-lg text-slate-400 hover:text-white transition-all text-sm">✕</button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Payee Name</label>
              <input value={form.payeeName} onChange={e => setForm({ ...form, payeeName: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:border-amber-500 outline-none" placeholder="e.g. Ramesh Kumar / vendor name" required />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Amount (₹)</label>
                <input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:border-amber-500 outline-none" placeholder="0.00" required />
              </div>
              
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Payment Method</label>
                <select value={form.method} onChange={e => setForm({ ...form, method: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-[10px] font-bold uppercase tracking-widest focus:border-amber-500 outline-none cursor-pointer">
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="upi">UPI</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Payout Type</label>
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-[10px] font-bold uppercase tracking-widest focus:border-amber-500 outline-none">
                  <option value="weekly_labor">Weekly Labor</option>
                  <option value="daily_wage">Daily Wage</option>
                  <option value="contractor">Contractor Fee</option>
                  <option value="material_payment">Material Payment</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Payee Type</label>
                <select value={form.payeeType} onChange={e => setForm({ ...form, payeeType: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-[10px] font-bold uppercase tracking-widest focus:border-amber-500 outline-none">
                  <option value="worker">Worker</option>
                  <option value="contractor">Contractor</option>
                  <option value="vendor">Vendor</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Period / Remarks</label>
              <input value={form.period} onChange={e => setForm({ ...form, period: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:border-amber-500 outline-none" placeholder="e.g. Week 42 / Material Advance" required />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button type="button" onClick={onClose} className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-400 font-bold rounded-xl transition-all uppercase tracking-widest text-[10px]">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold rounded-xl transition-all shadow-lg shadow-amber-500/10 uppercase tracking-widest text-[10px] active:scale-[0.98]">
              {saving ? 'Processing...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
