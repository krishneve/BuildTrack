import React, { useState, useEffect } from 'react';
import { invoiceService } from '../../services/invoiceService';
import { siteService } from '../../services/siteService';
import AdminLayout from '../../components/layout/AdminLayout';
import InvoiceOCRModal from '../../components/common/InvoiceOCRModal';

const STATUS_STYLES = {
  pending:  'bg-yellow-500/20 text-yellow-400',
  approved: 'bg-green-500/20 text-green-400',
  rejected: 'bg-red-500/20 text-red-400',
  paid:     'bg-blue-500/20 text-blue-400',
};

function fmtINR(n) { return `₹${Number(n||0).toLocaleString('en-IN')}`; }

export default function InvoiceManagement() {
  const [sites, setSites]     = useState([]);
  const [siteId, setSiteId]   = useState('all');
  const [invoices, setInvoices] = useState([]);
  const [summary, setSummary] = useState(null);
  const [filterStatus, setFilter] = useState('');
  const [loading, setLoading] = useState(false);
   const [processing, setProcessing] = useState(null);
  const [viewImage, setViewImage] = useState(null);
  const [showOCR, setShowOCR] = useState(false);

  useEffect(() => {
    siteService.getAll({ limit: 100 }).then(({ data }) => {
      setSites(data.data || []);
    });
  }, []);

  const fetchAll = React.useCallback(() => {
    if (!siteId) return;
    setLoading(true);
    Promise.all([
      invoiceService.getAll({ siteId, status: filterStatus || undefined, limit: 100 }),
      invoiceService.getSummary(siteId),
    ]).then(([inv, sum]) => {
      setInvoices(inv.data.data || []);
      setSummary(sum.data.data);
    }).finally(() => setLoading(false));
  }, [siteId, filterStatus]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleAction = async (id, status) => {
    const remarks = status === 'rejected' ? prompt('Reason for rejection?') : '';
    if (status === 'rejected' && !remarks) return;
    setProcessing(id);
    try {
      await invoiceService.updateStatus(id, status, remarks);
      fetchAll();
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed');
    } finally {
      setProcessing(null);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Invoice Management</h1>
            <p className="text-slate-500 text-sm mt-0.5">Track and approve supplier invoices</p>
          </div>
           <div className="flex gap-2">
            <button 
              onClick={() => {
                if (siteId === 'all') alert('Please select a specific site first');
                else setShowOCR(true);
              }}
              className="bg-amber-500 hover:bg-amber-400 text-slate-900 px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-lg shadow-amber-500/10 uppercase tracking-widest"
            >
              + AI Upload
            </button>
            <select value={siteId} onChange={e => setSiteId(e.target.value)} className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 font-bold">
              <option value="all">🌐 All Sites</option>
              {sites.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>
          </div>
        </div>

        {/* Summary */}
        {summary && (
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Pending', value: summary.pending, alert: summary.pending > 0 },
              { label: 'Approved', value: summary.approved },
              { label: 'Total Invoices', value: summary.total },
              { label: 'Approved Value', value: fmtINR(summary.approvedAmount) },
            ].map(c => (
              <div key={c.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">{c.label}</div>
                <div className={`text-2xl font-bold ${c.alert ? 'text-amber-400' : 'text-white'}`}>{c.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-2">
          {['', 'pending', 'approved', 'rejected', 'paid'].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors capitalize ${filterStatus === s ? 'bg-amber-500 text-slate-900' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'}`}>
              {s || 'All'}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-xs text-slate-500 uppercase tracking-wider">
                <th className="text-left px-5 py-3">Invoice #</th>
                <th className="text-left px-5 py-3">Supplier</th>
                <th className="text-left px-5 py-3">Category</th>
                <th className="text-right px-5 py-3">Amount</th>
                <th className="text-left px-5 py-3">Uploaded By</th>
                <th className="text-left px-5 py-3">Date</th>
                <th className="text-left px-5 py-3">Status</th>
                <th className="text-left px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-12 text-slate-500">Loading...</td></tr>
              ) : invoices.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-slate-600">No invoices found</td></tr>
              ) : invoices.map(inv => (
                <tr key={inv._id} className="border-b border-slate-800/50 hover:bg-slate-800/20">
                  <td className="px-5 py-3 text-amber-400 font-mono text-xs">
                    #{inv.invoiceNumber || inv._id.slice(-6).toUpperCase()}
                  </td>
                  <td className="px-5 py-3">
                    <div className="font-medium text-white">{inv.supplierName}</div>
                    {inv.supplierPhone && <div className="text-xs text-slate-500">{inv.supplierPhone}</div>}
                  </td>
                  <td className="px-5 py-3 text-slate-400 capitalize">{inv.category}</td>
                  <td className="px-5 py-3 text-right">
                    <div className="text-white font-semibold">{fmtINR(inv.totalAmount)}</div>
                    {inv.gst > 0 && <div className="text-xs text-slate-500">+GST {fmtINR(inv.gst)}</div>}
                  </td>
                  <td className="px-5 py-3 text-slate-400 text-xs">{inv.uploadedBy?.name}</td>
                  <td className="px-5 py-3 text-slate-400 text-xs">{new Date(inv.invoiceDate || inv.createdAt).toLocaleDateString('en-IN')}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${STATUS_STYLES[inv.status] || ''}`}>{inv.status}</span>
                    {inv.remarks && <div className="text-xs text-slate-500 mt-1 italic">"{inv.remarks}"</div>}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex flex-col gap-1.5 min-w-[80px]">
                      {inv.photoUrl && (
                        <button 
                          onClick={() => setViewImage(inv.photoUrl)}
                          className="text-[10px] text-blue-400 hover:text-blue-300 font-bold uppercase tracking-widest text-left"
                        >
                          👁 Preview
                        </button>
                      )}
                      
                      {inv.status === 'pending' && (
                        <div className="flex gap-2">
                          <button onClick={() => handleAction(inv._id, 'approved')} disabled={processing === inv._id}
                            className="text-xs text-green-400 hover:text-green-300 disabled:opacity-40 font-bold">Approve</button>
                          <button onClick={() => handleAction(inv._id, 'rejected')} disabled={processing === inv._id}
                            className="text-xs text-red-400 hover:text-red-300 disabled:opacity-40 font-bold">Reject</button>
                        </div>
                      )}
                      {inv.status === 'approved' && (
                        <button onClick={() => handleAction(inv._id, 'paid')} disabled={processing === inv._id}
                          className="text-xs text-blue-400 hover:text-blue-300 disabled:opacity-40 font-bold">Mark Paid</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Image Preview Modal */}
      {viewImage && (
        <div className="fixed inset-0 bg-black/90 z-[100] flex flex-col p-4 animate-fade-in" onClick={() => setViewImage(null)}>
          <div className="flex justify-between items-center mb-4 text-white p-2">
            <h3 className="font-black uppercase tracking-[0.3em] text-sm">Invoice Document Preview</h3>
            <button className="text-2xl hover:text-red-400 transition-colors">✕</button>
          </div>
          <div className="flex-1 flex items-center justify-center overflow-hidden">
            <img 
              src={viewImage.startsWith('http') ? viewImage : `http://localhost:5000${viewImage}`} 
              alt="Invoice" 
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl border-4 border-slate-800"
              onClick={e => e.stopPropagation()} 
            />
          </div>
          <div className="text-center text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-4">
            Click anywhere to exit preview
          </div>
        </div>
      )}
      {showOCR && (
        <InvoiceOCRModal 
          siteId={siteId} 
          onSaved={() => { setShowOCR(false); fetchAll(); }} 
          onClose={() => setShowOCR(false)} 
        />
      )}
    </AdminLayout>
  );
}
