import React, { useState, useEffect, useCallback } from 'react';
import EngineerLayout from '../../components/layout/EngineerLayout';
import { engineerService } from '../../services/engineerService';
import { useAuth } from '../../context/AuthContext';
import CameraCapture from '../../components/camera/CameraCapture';

const CATEGORY_EMOJI = {
  cement:'🏗', steel:'⚙', bricks:'🧱', sand:'🟨', aggregate:'⬤',
  wood:'🪵', paint:'🎨', plumbing:'🔧', electrical:'⚡', safety:'⛑', other:'▦'
};

export default function EngineerStock() {
  const { user } = useAuth();
  const siteId = user?.primarySite?._id || user?.primarySite;
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [showUpdate, setShowUpdate] = useState(null);

  const fetchStock = useCallback(() => {
    if (!siteId) { setLoading(false); return; }
    setLoading(true);
    engineerService.getStock(siteId)
      .then(r => setStock(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [siteId]);

  useEffect(() => { fetchStock(); }, [fetchStock]);

  const filtered = stock.filter(m => {
    if (filter === 'low') return m.isLowStock;
    if (filter !== 'all') return m.category === filter;
    return true;
  });

  const categories = ['all', 'low', ...new Set(stock.map(m => m.category))];

  return (
    <EngineerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Stock Control</h1>
            <p className="text-slate-500 text-sm mt-0.5">{stock.length} inventory items managed</p>
          </div>
          <button 
            onClick={() => setShowAdd(true)}
            className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold px-4 py-2 rounded-lg text-sm transition-all"
          >
            + New Material
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {categories.map(c => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`flex-none px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border ${
                filter === c 
                ? 'bg-amber-500 text-slate-900 border-amber-500' 
                : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-white'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {loading ? (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1,2,3].map(i => <div key={i} className="h-48 bg-slate-900 animate-pulse border border-slate-800 rounded-xl" />)}
           </div>
        ) : filtered.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-20 text-center">
             <p className="text-slate-500 text-sm uppercase font-bold tracking-widest">No stock records found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(m => (
              <div key={m._id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center text-xl">
                        {CATEGORY_EMOJI[m.category] || '▦'}
                    </div>
                    <div>
                      <div className="font-bold text-white text-sm truncate max-w-[120px]">{m.name}</div>
                      <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{m.category}</div>
                    </div>
                  </div>
                  {m.isLowStock && (
                    <span className="text-[9px] bg-red-500/10 text-red-500 border border-red-500/20 px-2 py-0.5 rounded font-black uppercase tracking-widest">Low</span>
                  )}
                </div>

                <div className="space-y-4 flex-1">
                    <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                        <div className="flex justify-between items-end mb-2">
                            <div>
                                <div className="text-[9px] text-slate-500 uppercase font-bold tracking-widest leading-none mb-1">Stock Level</div>
                                <div className="text-xl font-bold text-white">{m.currentStock} <span className="text-xs font-normal text-slate-600">{m.unit}</span></div>
                            </div>
                            <div className={`text-xs font-bold ${m.isLowStock ? 'text-red-400' : 'text-emerald-400'}`}>{m.fillPercent || 0}%</div>
                        </div>
                        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                           <div className={`h-1.5 rounded-full transition-all duration-700 ${m.isLowStock ? 'bg-red-500' : 'bg-emerald-500'}`}
                                style={{ width: `${Math.min(m.fillPercent || 0, 100)}%` }} />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4">
                  <button onClick={() => setShowUpdate({ ...m, type: 'in' })} className="py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all">Intake</button>
                  <button onClick={() => setShowUpdate({ ...m, type: 'out' })} className="py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all">Usage</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAdd && <AddMaterialModal siteId={siteId} onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); fetchStock(); }} />}
      {showUpdate && <UpdateStockModal siteId={siteId} material={showUpdate} onClose={() => setShowUpdate(null)} onSaved={() => { setShowUpdate(null); fetchStock(); }} />}
    </EngineerLayout>
  );
}

function AddMaterialModal({ siteId, onClose, onSaved }) {
    const [form, setForm] = useState({ name: '', category: 'cement', unit: 'bags', minThreshold: '', maxCapacity: '', unitCost: '', emoji: '🏗', image: null });
    const [saving, setSaving] = useState(false);
    const [detecting, setDetecting] = useState(false);
    const [showCamera, setShowCamera] = useState(false);
    const [error, setError] = useState('');

    const handleCapture = async (imageData) => {
      setShowCamera(false);
      setDetecting(true);
      setError('');
      try {
        const res = await engineerService.detectMaterial(imageData);
        const { materialName, category: aiCategory } = res.data.data;
        
        // Smart mapping to local categories
        const nameLower = materialName.toLowerCase();
        let catKey = 'other';
        if (nameLower.includes('cement')) catKey = 'cement';
        else if (nameLower.includes('steel') || nameLower.includes('iron')) catKey = 'steel';
        else if (nameLower.includes('brick')) catKey = 'bricks';
        else if (nameLower.includes('sand')) catKey = 'sand';
        else if (nameLower.includes('aggregate') || nameLower.includes('stone')) catKey = 'aggregate';
        else if (nameLower.includes('wood') || nameLower.includes('timber')) catKey = 'wood';
        else if (nameLower.includes('paint')) catKey = 'paint';
        else if (nameLower.includes('pipe') || nameLower.includes('plumb')) catKey = 'plumbing';
        else if (nameLower.includes('wire') || nameLower.includes('elect')) catKey = 'electrical';
        else if (nameLower.includes('helmet') || nameLower.includes('vest') || nameLower.includes('safety')) catKey = 'safety';

        setForm(prev => ({ 
          ...prev, 
          name: materialName.toUpperCase(), 
          category: catKey, 
          image: imageData,
          emoji: CATEGORY_EMOJI[catKey] || '▦'
        }));
      } catch (err) {
        console.error("Detection Failed:", err);
        setError("AI could not detect material. Please enter manually.");
      } finally {
        setDetecting(false);
      }
    };
  
    const handleSubmit = async (e) => {
      e.preventDefault();
      setSaving(true);
      try {
        await engineerService.addMaterial({ ...form, siteId });
        onSaved();
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to add material');
      } finally {
        setSaving(false);
      }
    };
  
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-xl shadow-2xl overflow-hidden animate-slide-up">
           <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">New Material Record</h2>
              <button onClick={onClose} className="text-slate-500 hover:text-white">✕</button>
           </div>
           <form onSubmit={handleSubmit} className="p-6 space-y-4">
               {error && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold rounded-lg">{error}</div>}
              
              <div className="flex flex-col gap-4">
                 <button 
                  type="button" 
                  onClick={() => setShowCamera(true)}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition-all border border-slate-700"
                >
                  <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>Capture Material Image</span>
                </button>

                {form.image && (
                  <div className="relative w-full h-32 bg-slate-950 rounded-xl overflow-hidden border border-slate-800">
                    <img src={form.image} alt="Preview" className="w-full h-full object-cover opacity-50" />
                    <div className="absolute inset-0 flex items-center justify-center">
                       <span className="text-[10px] font-bold text-amber-500 bg-slate-900/80 px-2 py-1 rounded">IMAGE CAPTURED ✅</span>
                    </div>
                    <button type="button" onClick={() => setForm({...form, image: null})} className="absolute top-2 right-2 p-1 bg-red-500 rounded-full text-white text-[10px]">✕</button>
                  </div>
                )}

                {detecting && (
                  <div className="flex items-center justify-center gap-2 text-amber-500 text-xs font-bold animate-pulse">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    AI IS ANALYZING...
                  </div>
                )}
              </div>

              <div className="space-y-1">
                 <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Identity</label>
                 <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white text-sm focus:border-amber-500 outline-none transition-all uppercase" placeholder="MATERIAL NAME" />
              </div>
  
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Category</label>
                    <select value={form.category} onChange={e => setForm({...form, category: e.target.value, emoji: CATEGORY_EMOJI[e.target.value]})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-[10px] font-bold uppercase outline-none">
                      {['cement','steel','bricks','sand','aggregate','wood','paint','plumbing','electrical','safety','other'].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Unit</label>
                    <select value={form.unit} onChange={e => setForm({...form, unit: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-[10px] font-bold uppercase outline-none">
                      {['bags','kg','tonnes','pcs','litre','sqft','rmt','nos'].map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                 </div>
              </div>
  
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Min Threshold</label>
                    <input type="number" value={form.minThreshold} onChange={e => setForm({...form, minThreshold: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white text-sm" placeholder="000" />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Max Capacity</label>
                    <input type="number" value={form.maxCapacity} onChange={e => setForm({...form, maxCapacity: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white text-sm" placeholder="000" />
                 </div>
              </div>
  
               <button type="submit" disabled={saving || detecting} className="w-full bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold py-3 rounded-lg mt-4 transition-all text-xs uppercase tracking-widest disabled:opacity-50">
                {saving ? 'Saving...' : 'Create Material'}
              </button>
           </form>
           {showCamera && <CameraCapture onCapture={handleCapture} onClose={() => setShowCamera(false)} />}
        </div>
      </div>
    );
  }
  
  function UpdateStockModal({ siteId, material, onClose, onSaved }) {
    const [qty, setQty] = useState('');
    const [notes, setNotes] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
  
    const handleUpdate = async (e) => {
      e.preventDefault();
      setSaving(true);
      try {
        const payload = { siteId, materialId: material._id, quantity: Number(qty), notes };
        if (material.type === 'in') await engineerService.materialIn(payload);
        else await engineerService.materialOut(payload);
        onSaved();
      } catch (err) {
        setError(err.response?.data?.message || 'Update failed');
      } finally {
        setSaving(false);
      }
    };
  
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-xl shadow-2xl overflow-hidden animate-slide-up">
           <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">{material.type === 'in' ? 'Intake' : 'Usage'}: {material.name}</h2>
              <button onClick={onClose} className="text-slate-500 hover:text-white">✕</button>
           </div>
           <form onSubmit={handleUpdate} className="p-6 space-y-4">
              {error && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold rounded-lg">{error}</div>}
              
              <div className="space-y-1">
                 <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Quantity ({material.unit})</label>
                 <input type="number" step="0.01" value={qty} onChange={e => setQty(e.target.value)} className={`w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-4 text-white text-3xl font-bold text-center outline-none focus:border-${material.type === 'in' ? 'emerald' : 'red'}-500`} placeholder="0.00" autoFocus required />
              </div>
  
              <div className="space-y-1">
                 <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Notes</label>
                 <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white text-xs min-h-[80px]" placeholder="..." />
              </div>
  
              <button type="submit" disabled={saving} className={`w-full font-bold py-3 rounded-lg mt-2 transition-all text-xs uppercase tracking-widest ${
                  material.type === 'in' ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-red-600 hover:bg-red-500 text-white'
              }`}>
                {saving ? 'Transacting...' : `Register ${material.type.toUpperCase()}`}
              </button>
           </form>
        </div>
      </div>
    );
  }
