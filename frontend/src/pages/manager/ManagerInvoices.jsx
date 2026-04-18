import React, { useState, useEffect } from 'react';
import ManagerLayout from '../../components/layout/ManagerLayout';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import InvoiceOCRModal from '../../components/common/InvoiceOCRModal';

const STATUS_STYLE = {
  pending:  'bg-amber-500/20 text-amber-500 border-amber-500/30',
  approved: 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30',
  rejected: 'bg-red-500/20 text-red-500 border-red-500/30',
  paid:     'bg-blue-500/20 text-blue-500 border-blue-500/30',
};

export default function ManagerInvoices() {
  const { user } = useAuth();
  const siteId = user?.primarySite?._id || user?.primarySite;
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [showOCR, setShowOCR] = useState(false);

  const fetchInvoices = React.useCallback(() => {
    if (!siteId) return;
    setLoading(true);
    api.get(`/invoices`, { params: { siteId } })
      .then(r => setInvoices(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [siteId]);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  const updateStatus = async (id, status) => {
    try {
      if (status === 'rejected') {
        const reason = window.prompt('Reason for rejection:');
        if (reason === null) return;
        await api.patch(`/invoices/${id}/status`, { status, remarks: reason });
      } else {
        await api.patch(`/invoices/${id}/status`, { status });
      }
      fetchInvoices();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const filtered = filter === 'all' ? invoices : invoices.filter(i => i.status === filter);

  return (
    <ManagerLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-5">
          <div>
            <h1 className="text-2xl font-bold text-white">Invoice Management</h1>
            <p className="text-slate-500 text-sm mt-0.5">{invoices.length} total filings tracked</p>
          </div>
          <div className="flex gap-3">
             <button onClick={() => setShowOCR(true)} className="bg-amber-500 hover:bg-amber-400 text-slate-900 px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-lg shadow-amber-500/10 uppercase tracking-widest">
                + Upload & Scan
             </button>
             <button onClick={fetchInvoices} className="bg-slate-900 hover:bg-slate-800 text-white border border-slate-800 px-4 py-2 rounded-lg text-sm transition-all shadow-sm">
                ↻ Refresh
             </button>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {['pending', 'approved', 'paid', 'rejected', 'all'].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-5 py-2.5 rounded-xl text-xs font-semibold capitalize transition-all border shadow-sm ${
                filter === s 
                ? 'bg-amber-500 text-slate-900 border-amber-500 shadow-amber-500/10' 
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}>
              {s}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => <div key={i} className="h-40 bg-slate-900/50 rounded-xl animate-pulse border border-slate-800"></div>)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-16 text-center">
            <p className="text-slate-600 font-medium">No {filter !== 'all' ? filter : ''} invoices found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filtered.map(inv => (
              <div key={inv._id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-600 transition-all group">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="flex gap-5">
                    <div className="w-14 h-14 bg-slate-800 rounded-xl flex items-center justify-center text-3xl shadow-inner group-hover:scale-105 transition-all">📄</div>
                    <div>
                      <div className="font-bold text-lg text-white">{inv.supplierName}</div>
                      <div className="text-[10px] font-bold text-slate-500 mt-2 flex flex-wrap items-center gap-3 tracking-wider uppercase">
                        <span className="bg-slate-800 text-slate-400 px-2 py-0.5 rounded">#{inv.invoiceNumber}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                        <span className="text-amber-500/80">{inv.category}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                        <span>{new Date(inv.invoiceDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="lg:text-right bg-slate-800/40 p-4 rounded-xl min-w-[160px] border border-slate-800/50">
                    <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Invoice Amount</div>
                    <div className="text-xl font-bold text-white">₹{Number(inv.amount || 0).toLocaleString()}</div>
                    {inv.gst > 0 && <div className="text-[10px] text-slate-500 mt-1 italic">+ GST ₹{inv.gst.toLocaleString()}</div>}
                  </div>
                </div>

                <div className="mt-6 pt-5 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <span className={`text-[10px] font-bold px-3 py-1 rounded-full border uppercase tracking-wider ${STATUS_STYLE[inv.status]}`}>
                      {inv.status}
                    </span>
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest">By: {inv.uploadedBy?.name || 'Engineer'}</span>
                  </div>

                  <div className="flex items-center gap-3 w-full md:w-auto">
                    {inv.photoUrl && (
                      <a href={`${process.env.REACT_APP_API_URL?.replace('/api/v1', '') || 'http://localhost:5000'}${inv.photoUrl}`}
                         target="_blank" rel="noreferrer"
                         className="flex-1 md:flex-none text-center text-[10px] font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-6 py-3 rounded-lg transition-all border border-slate-700 uppercase tracking-widest">
                         View PDF
                      </a>
                    )}
                    {inv.status === 'pending' && (
                      <div className="flex gap-3 flex-1 md:flex-none">
                        <button onClick={() => updateStatus(inv._id, 'rejected')} className="flex-1 md:flex-none bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[10px] font-bold px-6 py-3 rounded-lg border border-red-500/20 uppercase tracking-widest transition-all">Decline</button>
                        <button onClick={() => updateStatus(inv._id, 'approved')} className="flex-1 md:flex-none bg-amber-500 hover:bg-amber-400 text-slate-900 text-[10px] font-bold px-6 py-3 rounded-lg shadow-lg shadow-amber-500/10 uppercase tracking-widest transition-all active:scale-95">Approve</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {showOCR && (
        <InvoiceOCRModal 
          siteId={siteId} 
          onSaved={() => { setShowOCR(false); fetchInvoices(); }} 
          onClose={() => setShowOCR(false)} 
        />
      )}
    </ManagerLayout>
  );
}
