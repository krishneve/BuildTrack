import React, { useState } from 'react';
import { aiService } from '../../services/aiService';
import { invoiceService } from '../../services/invoiceService';

export default function InvoiceOCRModal({ siteId, onSaved, onClose }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  const [form, setForm] = useState({
    supplierName: '',
    invoiceNumber: '',
    invoiceDate: '',
    amount: '',
    gst: '0',
    category: 'materials',
    notes: ''
  });

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (selectedFile.type.startsWith('image/')) {
        setPreview(URL.createObjectURL(selectedFile));
      } else {
        setPreview(null);
      }
      handleExtract(selectedFile);
    }
  };

  const handleExtract = async (selectedFile) => {
    setExtracting(true);
    setError('');
    const fd = new FormData();
    fd.append('invoice', selectedFile);
    
    try {
      const res = await aiService.extractInvoice(fd);
      const data = res.data.data;
      
      setForm(prev => ({
        ...prev,
        supplierName: (data.supplierName || '').toUpperCase(),
        invoiceNumber: (data.invoiceNumber || '').toUpperCase(),
        invoiceDate: data.date ? new Date(data.date).toISOString().split('T')[0] : '',
        amount: data.totalAmount || '',
      }));
    } catch (err) {
      console.error("Extraction failed:", err);
      setError("AI extraction failed. Please enter data manually.");
    } finally {
      setExtracting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!siteId) { setError("Please select a site first"); return; }
    
    setSaving(true);
    const fd = new FormData();
    fd.append('siteId', siteId);
    fd.append('photo', file); // Field name expected by backend for photo is 'photo' (see invoiceRoutes.js)
    
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    
    try {
      await invoiceService.upload(fd);
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save invoice");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[95vh] animate-slide-up">
        
        {/* Left: Preview */}
        <div className="w-full md:w-1/2 bg-slate-950 p-6 flex flex-col border-b md:border-b-0 md:border-r border-slate-800 overflow-hidden">
           <div className="flex justify-between items-center mb-4">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Document Source</h3>
              {file && <span className="text-[9px] text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">FILE LOADED</span>}
           </div>
           
           <div className="flex-1 min-h-[300px] border-2 border-dashed border-slate-800 rounded-xl relative overflow-hidden flex items-center justify-center bg-slate-900/20 group">
              {preview ? (
                <img src={preview} alt="Invoice" className="w-full h-full object-contain" />
              ) : file ? (
                <div className="text-center p-8">
                   <div className="text-5xl mb-4">📄</div>
                   <div className="text-xs font-bold text-white uppercase truncate max-w-[200px]">{file.name}</div>
                   <div className="text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-widest">Document View Not Available</div>
                </div>
              ) : (
                <div className="text-center p-8 pointer-events-none">
                   <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                      <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                   </div>
                   <p className="text-sm font-bold text-white uppercase tracking-widest">Drop Invoice Here</p>
                   <p className="text-[10px] text-slate-500 mt-2 uppercase font-bold">Supported: PDF, JPG, PNG, WEBP</p>
                </div>
              )}
              <input type="file" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*,application/pdf" />
           </div>
           
           {file && (
             <button onClick={() => setFile(null)} className="mt-4 text-[10px] font-bold text-slate-500 hover:text-white uppercase transition-colors tracking-widest italic underline underline-offset-4 decoration-amber-500/50">Change Selection</button>
           )}
        </div>

        {/* Right: Form */}
        <div className="flex-1 flex flex-col min-w-0 bg-slate-900 overflow-hidden">
           <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <div>
                 <h2 className="text-white font-bold text-xl tracking-tight">AI Data Extraction</h2>
                 <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mt-1">Review & Finalize Records</p>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-red-500/20 hover:text-red-500 flex items-center justify-center text-slate-400 transition-all">✕</button>
           </div>
           
           <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
              {error && <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold rounded-xl uppercase tracking-widest mb-2">{error}</div>}
              
              {extracting && (
                <div className="p-6 bg-amber-500/5 border border-amber-500/10 rounded-2xl text-center animate-pulse mb-4">
                   <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                   <p className="text-amber-500 text-[11px] font-black uppercase tracking-[0.3em]">BuildTrack AI: Extracting Intelligence...</p>
                </div>
              )}

              <div className="space-y-2">
                 <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Supplier / Merchant</label>
                 <input 
                   required
                   value={form.supplierName} 
                   onChange={e => setForm({...form, supplierName: e.target.value})}
                   className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm font-bold focus:border-amber-500 outline-none transition-all uppercase placeholder:text-slate-800"
                   placeholder="e.g. ULTRA TECH CEMENT"
                 />
              </div>

              <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Invoice ID #</label>
                    <input 
                      required
                      value={form.invoiceNumber} 
                      onChange={e => setForm({...form, invoiceNumber: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm font-mono focus:border-amber-500 outline-none transition-all placeholder:text-slate-800"
                      placeholder="INV-12345"
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Filing Date</label>
                    <input 
                      type="date"
                      required
                      value={form.invoiceDate} 
                      onChange={e => setForm({...form, invoiceDate: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm font-bold focus:border-emerald-500 outline-none transition-all"
                    />
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Total Amount (₹)</label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 font-bold">₹</span>
                        <input 
                          type="number"
                          required
                          value={form.amount} 
                          onChange={e => setForm({...form, amount: e.target.value})}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-4 py-3 text-white text-xl font-black focus:border-amber-500 outline-none transition-all placeholder:text-slate-800"
                          placeholder="0,000"
                        />
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Category Tags</label>
                    <select 
                      value={form.category} 
                      onChange={e => setForm({...form, category: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-[10px] font-black uppercase tracking-widest focus:border-amber-500 outline-none transition-all h-[50px]"
                    >
                       {['materials','labor','equipment','overhead','other'].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                 </div>
              </div>

              <div className="space-y-2">
                 <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Internal Remarks</label>
                 <textarea 
                   value={form.notes} 
                   onChange={e => setForm({...form, notes: e.target.value})}
                   className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-xs min-h-[80px] focus:border-slate-600 outline-none transition-all"
                   placeholder="Add any context or approval notes..."
                 />
              </div>

              <div className="flex gap-4 pt-6 border-t border-slate-800 bg-slate-900 sticky bottom-0 z-10">
                 <button type="button" onClick={onClose} className="flex-1 py-4 border border-slate-800 text-slate-500 font-bold text-[10px] rounded-xl uppercase tracking-widest hover:bg-slate-800 hover:text-white transition-all">Discard</button>
                 <button 
                  type="submit" 
                  disabled={saving || !file || extracting}
                  className="flex-[2] py-4 bg-amber-500 hover:bg-amber-400 disabled:opacity-30 disabled:grayscale text-slate-900 font-black text-[10px] rounded-xl uppercase tracking-[0.3em] shadow-[0_10px_30px_rgba(245,158,11,0.2)] transition-all active:scale-95"
                 >
                    {saving ? 'Transacting Data...' : 'Authorize Transaction'}
                 </button>
              </div>
           </form>
        </div>
      </div>
    </div>
  );
}
