import React, { useState, useEffect } from 'react';
import ManagerLayout from '../../components/layout/ManagerLayout';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const CATEGORY_EMOJI = {
  cement:'🏗', steel:'⚙', bricks:'🧱', sand:'🟨', aggregate:'⬤',
  wood:'🪵', paint:'🎨', plumbing:'🔧', electrical:'⚡', safety:'⛑', other:'▦'
};

export default function ManagerMaterials() {
  const { user } = useAuth();
  const siteId = user?.primarySite?._id || user?.primarySite;
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchMaterials = React.useCallback(() => {
    if (!siteId) return;
    setLoading(true);
    api.get(`/inventory`, { params: { siteId } })
      .then(r => setMaterials(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [siteId]);

  useEffect(() => { fetchMaterials(); }, [fetchMaterials]);

  const lowStock = materials.filter(m => m.currentStock <= m.minThreshold);
  const filtered = filter === 'low' ? lowStock : materials;

  return (
    <ManagerLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-5">
          <div>
            <h1 className="text-2xl font-bold text-white">Stock Management</h1>
            <p className="text-slate-500 text-sm mt-0.5">{materials.length} items monitored at this site</p>
          </div>
          <button onClick={fetchMaterials} className="bg-slate-900 hover:bg-slate-800 text-white border border-slate-800 px-4 py-2 rounded-lg text-sm transition-all shadow-sm">
             ↻ Refresh Stock
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2">
          {[
            { id: 'all', label: 'All Inventory', count: materials.length },
            { id: 'low', label: 'Low Stock', count: lowStock.length, urgent: lowStock.length > 0 },
          ].map(t => (
            <button key={t.id} onClick={() => setFilter(t.id)}
              className={`px-5 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-3 border shadow-sm ${
                filter === t.id 
                ? 'bg-amber-500 text-slate-900 border-amber-500 shadow-amber-500/10' 
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}>
              {t.label}
              <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${filter === t.id ? 'bg-slate-900/10 text-slate-900' : t.urgent ? 'bg-red-500/20 text-red-400' : 'bg-slate-800 text-slate-500'}`}>{t.count}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1,2,3].map(i => <div key={i} className="h-48 bg-slate-900/50 rounded-xl animate-pulse border border-slate-800"></div>)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-20 text-center">
             <p className="text-slate-600 font-medium text-sm">
               {filter === 'low' ? 'No low stock alerts for now.' : 'No materials identified at this site.'}
             </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(m => (
              <div key={m._id} className={`bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-600 transition-all group relative ${
                m.currentStock <= m.minThreshold ? 'border-red-500/30 bg-red-500/5' : ''
              }`}>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-slate-800 rounded-lg flex items-center justify-center text-2xl group-hover:scale-105 transition-all">
                    {CATEGORY_EMOJI[m.category] || '▦'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-white text-base truncate">{m.name}</div>
                    <div className="text-[10px] uppercase font-bold text-slate-500 mt-0.5 tracking-wider">{m.category}</div>
                  </div>
                  {m.currentStock <= m.minThreshold && (
                    <span className="text-[10px] bg-red-500 text-white font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter self-start mt-1">Low</span>
                  )}
                </div>

                <div className="space-y-5">
                  <div>
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider mb-2">
                      <span className="text-slate-500">Current Stock</span>
                      <span className={`font-black ${m.currentStock <= m.minThreshold ? 'text-red-400' : 'text-amber-400'}`}>
                        {m.currentStock} {m.unit}
                      </span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-700 ${
                        m.currentStock <= m.minThreshold ? 'bg-red-500' : 'bg-amber-500'
                      }`} style={{ width: `${Math.min((m.currentStock / (m.maxCapacity || (m.minThreshold * 5))) * 100, 100)}%` }} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800">
                    <div>
                      <div className="text-[9px] text-slate-500 font-bold uppercase mb-1">Min. Buffer</div>
                      <div className="font-semibold text-white text-sm">{m.minThreshold} {m.unit}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[9px] text-slate-500 font-bold uppercase mb-1">Unit Cost</div>
                      <div className="font-semibold text-white text-sm">₹{m.unitCost}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ManagerLayout>
  );
}
