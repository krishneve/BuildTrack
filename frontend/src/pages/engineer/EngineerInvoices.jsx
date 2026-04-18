import React, { useState, useEffect, useCallback } from 'react';
import EngineerLayout from '../../components/layout/EngineerLayout';
import { engineerService } from '../../services/engineerService';
import { useAuth } from '../../context/AuthContext';

export default function EngineerInvoices() {
  const { user } = useAuth();
  const siteId = user?.primarySite?._id || user?.primarySite;
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [preview, setPreview] = useState(null);

  const fetchInvoices = useCallback(() => {
    if (!siteId) { setLoading(false); return; }
    setLoading(true);
    engineerService.getMyInvoices(siteId)
      .then(r => setInvoices(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [siteId]);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  return (
    <EngineerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-5">
           <div>
              <h1 className="text-2xl font-bold text-white">Billings & Ledgers</h1>
              <p className="text-slate-500 text-sm mt-0.5">{invoices.length} field records authenticated</p>
           </div>
           <button 
             onClick={() => setShowUpload(true)}
             className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold px-4 py-2 rounded-lg text-sm transition-all"
           >
             + Upload Invoice
           </button>
        </div>

        {loading ? (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1,2,3].map(i => <div key={i} className="h-48 bg-slate-900 animate-pulse border border-slate-800 rounded-xl" />)}
           </div>
        ) : invoices.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-20 text-center">
             <p className="text-slate-500 text-sm uppercase font-bold tracking-widest">No invoices logged</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {invoices.map(inv => (
              <div key={inv._id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all flex flex-col group">
                 <div className="flex justify-between items-start mb-4">
                    <span className={`text-[10px] px-2 py-0.5 rounded font-black uppercase tracking-wider ${
                        inv.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500' :
                        inv.status === 'rejected' ? 'bg-red-500/10 text-red-500' :
                        'bg-amber-500/10 text-amber-500'
                    }`}>
                        {inv.status}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">
                        {new Date(inv.createdAt).toLocaleDateString()}
                    </span>
                 </div>

                 <div className="mb-4">
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Supplier</div>
                    <div className="text-lg font-bold text-white truncate">{inv.supplierName}</div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase mt-1">{inv.category || 'Materials'}</div>
                 </div>

                 <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 mb-4 flex justify-between items-center">
                    <div>
                        <div className="text-[9px] text-slate-600 font-bold uppercase tracking-widest mb-1">Amount</div>
                        <div className="text-2xl font-bold text-white">₹{inv.amount.toLocaleString()}</div>
                    </div>
                    {inv.photoUrl && (
                        <button onClick={() => setPreview(inv.photoUrl)} className="w-10 h-10 bg-slate-800 hover:bg-slate-700 text-white rounded-lg flex items-center justify-center transition-all">📄</button>
                    )}
                 </div>

                 <div className="text-[10px] font-bold text-slate-600 flex items-center justify-between uppercase mt-auto pt-3 border-t border-slate-800">
                    <span># {inv.invoiceNumber || 'N/A'}</span>
                    <span className="text-slate-500">Tax: ₹{inv.gst || 0}</span>
                 </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showUpload && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
           <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden animate-slide-up flex flex-col md:flex-row">
              <div className="p-8 flex-1">
                 <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-6">Filing New Invoice</h2>
                 <UploadInvoiceForm siteId={siteId} onSaved={() => { setShowUpload(false); fetchInvoices(); }} onCancel={() => setShowUpload(false)} />
              </div>
           </div>
        </div>
      )}

      {preview && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4" onClick={() => setPreview(null)}>
           <div className="relative max-w-2xl w-full bg-slate-900 p-2 rounded-xl border border-slate-800" onClick={e => e.stopPropagation()}>
                <div className="max-h-[80vh] overflow-y-auto rounded-lg">
                   <img src={`http://localhost:5000${preview}`} alt="Invoice" className="w-full h-auto" />
                </div>
                <button onClick={() => setPreview(null)} className="absolute top-4 right-4 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center">✕</button>
           </div>
        </div>
      )}
    </EngineerLayout>
  );
}

function UploadInvoiceForm({ siteId, onSaved, onCancel }) {
    const [form, setForm] = useState({ supplierName: '', amount: '', gst: '', invoiceNumber: '', category: 'cement' });
    const [file, setFile] = useState(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) { setError('Scan file is mandatory'); return; }
        setSaving(true);
        try {
            const fd = new FormData();
            fd.append('siteId', siteId);
            fd.append('invoice', file);
            Object.entries(form).forEach(([k,v]) => fd.append(k,v));
            await engineerService.uploadInvoice(fd);
            onSaved();
        } catch (err) {
            setError(err.response?.data?.message || 'Submission failed');
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="p-3 bg-red-500/10 text-red-500 text-xs font-bold rounded-lg">{error}</div>}
            
            <input required value={form.supplierName} onChange={e => setForm({...form, supplierName:e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white text-sm outline-none uppercase" placeholder="Supplier Name" />
            
            <div className="grid grid-cols-2 gap-4">
                <input required type="number" value={form.amount} onChange={e => setForm({...form, amount:e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white text-sm outline-none" placeholder="Amount (₹)" />
                <input type="number" value={form.gst} onChange={e => setForm({...form, gst:e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white text-sm outline-none" placeholder="GST (₹)" />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <input value={form.invoiceNumber} onChange={e => setForm({...form, invoiceNumber:e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white text-sm outline-none uppercase" placeholder="INV #" />
                <select value={form.category} onChange={e => setForm({...form, category:e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs font-bold uppercase">
                    {['cement','steel','bricks','sand','aggregate','wood','paint','plumbing','electrical','safety','other'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
            </div>

            <label className="block border-2 border-dashed border-slate-800 rounded-xl p-6 text-center cursor-pointer hover:border-slate-600 transition-all">
                <span className="text-xs text-slate-500 font-bold uppercase">{file ? file.name : 'Click to upload scan'}</span>
                <input type="file" className="hidden" accept="image/*,application/pdf" onChange={e => setFile(e.target.files[0])} />
            </label>

            <div className="flex gap-3 pt-2">
                <button type="button" onClick={onCancel} className="flex-1 py-3 bg-slate-800 text-slate-400 text-xs font-bold rounded-lg uppercase">Cancel</button>
                <button type="submit" disabled={saving} className="flex-[2] py-3 bg-amber-500 text-slate-900 text-xs font-bold rounded-lg uppercase">
                    {saving ? 'Uploading...' : 'Submit Records'}
                </button>
            </div>
        </form>
    );
}
