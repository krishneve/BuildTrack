import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { siteService } from '../../services/siteService';
import EngineerLayout from '../../components/layout/EngineerLayout';

function formatL(n) {
  if (!n) return '₹0';
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)} L`;
  return `₹${Number(n).toLocaleString()}`;
}

export default function EngineerDrawings() {
  const { user } = useAuth();
  const [site, setSite] = useState(null);
  const [loading, setLoading] = useState(true);
  const siteId = user?.primarySite?._id || user?.primarySite;

  useEffect(() => {
    if (!siteId) { setLoading(false); return; }
    siteService.getById(siteId)
      .then(({ data }) => setSite(data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [siteId]);

  if (loading) return <EngineerLayout><div className="flex items-center justify-center min-h-[50vh] text-[var(--text-secondary)] font-bold uppercase tracking-widest text-xs animate-pulse">Loading Drawing Center...</div></EngineerLayout>;

  if (!site) return (
    <EngineerLayout>
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center border-2 border-dashed border-[var(--border-color)] rounded-2xl p-10 bg-[var(--bg-secondary)]/30">
        <div className="text-3xl mb-4">⚠</div>
        <div className="text-red-400 font-black uppercase tracking-widest text-sm mb-2">No Site Profile Found</div>
        <p className="text-[var(--text-secondary)] text-xs font-bold leading-relaxed max-w-xs">Please contact the administrator to ensure you are professionally assigned to an active construction site.</p>
      </div>
    </EngineerLayout>
  );

  return (
    <EngineerLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-end justify-between bg-[var(--bg-secondary)]/50 p-6 rounded-2xl border border-[var(--border-color)] transition-colors">
          <div>
            <div className="text-[10px] text-amber-500 font-black uppercase tracking-[0.3em] mb-2">Drawing Submission Monitor</div>
            <h1 className="text-3xl font-black text-[var(--text-primary)] tracking-tight leading-none uppercase">{site.name}</h1>
            <div className="text-[10px] text-[var(--text-secondary)] font-bold mt-2 uppercase tracking-widest">
              Execution Control Center · {site.siteCode}
            </div>
          </div>
          <div className="text-right">
             <div className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-widest mb-1">Live Progression</div>
             <div className="text-4xl font-black text-amber-500 leading-none">{site.metrics?.progressPercent || 0}%</div>
          </div>
        </div>

        {site.architects?.length > 0 ? (
          <div className="grid grid-cols-1 gap-6">
            {site.architects.map(arc => (
              <div key={arc._id} className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-sm">
                <div className="p-5 border-b border-[var(--border-color)] bg-[var(--bg-secondary)]/30 flex items-center justify-between">
                  <div>
                    <div className="text-[9px] text-[var(--text-secondary)] font-black uppercase tracking-[0.2em] mb-0.5">Assigned Architect</div>
                    <div className="text-lg font-black text-[var(--text-primary)] uppercase tracking-tight">{arc.name}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-[9px] text-[var(--text-secondary)] font-black uppercase tracking-[0.2em] mb-0.5">Payment Status</div>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase ${
                        arc.payment?.status === 'paid' ? 'bg-green-500/20 text-green-400' : 
                        arc.payment?.status === 'partial' ? 'bg-amber-500/20 text-amber-500' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {arc.payment?.status || 'Pending'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {/* Drawing List */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-2">
                       <h3 className="text-[10px] text-[var(--text-secondary)] font-black uppercase tracking-[0.2em]">Blueprint Checklist (Stock for Execution)</h3>
                       <div className="flex items-center gap-2">
                          <div className="w-24 h-1.5 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                             <div 
                               className="h-full bg-amber-500 transition-all" 
                               style={{ width: `${(arc.drawings?.filter(d => d.status === 'submitted').length / (arc.drawings?.length || 1)) * 100}%` }}
                             />
                          </div>
                          <span className="text-[10px] font-black text-white">{arc.drawings?.filter(d => d.status === 'submitted').length || 0}/{arc.drawings?.length || 0}</span>
                       </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {arc.drawings?.length > 0 ? arc.drawings.map(dwg => (
                        <div key={dwg._id} className="bg-[var(--bg-primary)] border border-[var(--border-color)] p-4 rounded-xl flex items-center justify-between group hover:border-amber-500/30 transition-all">
                           <div className="flex items-center gap-4">
                              <div className={`w-3 h-3 rounded-full flex-shrink-0 border-2 ${dwg.status === 'submitted' ? 'bg-green-500 border-green-500/20 shadow-lg shadow-green-500/10' : 'bg-slate-700 border-slate-600'}`} />
                              <div>
                                 <div className="text-xs font-black text-[var(--text-primary)] uppercase tracking-tight">{dwg.name}</div>
                                 <div className="text-[9px] text-[var(--text-secondary)] font-bold uppercase tracking-widest mt-0.5">
                                    {dwg.type || 'Architectural'} {dwg.submissionDate && `· ${new Date(dwg.submissionDate).toLocaleDateString()}`}
                                 </div>
                              </div>
                           </div>
                           <div className="flex items-center gap-3">
                              <span className={`text-[8px] font-black uppercase tracking-[0.2em] px-2 py-1 rounded bg-[var(--bg-tertiary)] ${dwg.status === 'submitted' ? 'text-green-500' : 'text-slate-500'}`}>
                                 {dwg.status}
                              </span>
                              {dwg.fileUrl && (
                                <button className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center hover:bg-amber-500 hover:text-slate-900 transition-all text-xs">
                                   ↓
                                </button>
                              )}
                           </div>
                        </div>
                      )) : (
                        <div className="col-span-2 text-center py-6 border-2 border-dashed border-[var(--border-color)] rounded-xl opacity-30">
                           <div className="text-[10px] font-black uppercase tracking-widest">No Documents Registered</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Payment Overview (View Only for Engineer) */}
                  <div className="mt-8 pt-6 border-t border-[var(--border-color)]">
                    <h3 className="text-[10px] text-[var(--text-secondary)] font-black uppercase tracking-[0.2em] mb-4">Architectural Disbursement Summary</h3>
                    <div className="grid grid-cols-3 gap-4">
                       <div className="bg-[var(--bg-primary)] p-3 rounded-xl border border-[var(--border-color)]">
                          <div className="text-[8px] text-[var(--text-secondary)] font-black uppercase tracking-widest mb-1">Contract Value</div>
                          <div className="text-sm font-black text-[var(--text-primary)]">{formatL(arc.payment?.totalAmount)}</div>
                       </div>
                       <div className="bg-[var(--bg-primary)] p-3 rounded-xl border border-[var(--border-color)]">
                          <div className="text-[8px] text-[var(--text-secondary)] font-black uppercase tracking-widest mb-1">Settled Amount</div>
                          <div className="text-sm font-black text-green-500">{formatL(arc.payment?.paidAmount)}</div>
                       </div>
                       <div className="bg-[var(--bg-primary)] p-3 rounded-xl border border-[var(--border-color)]">
                          <div className="text-[8px] text-[var(--text-secondary)] font-black uppercase tracking-widest mb-1">Work-in-Progress</div>
                          <div className="text-sm font-black text-amber-500">₹0</div>
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-[var(--bg-secondary)]/30 rounded-2xl border-2 border-dashed border-[var(--border-color)]">
             <div className="text-[var(--text-secondary)] font-black uppercase tracking-widest mb-2 opacity-30 text-xl">Empty Drawing Board</div>
             <p className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-[0.2em] max-w-xs mx-auto leading-relaxed">The administrative architects have not yet synchronized the blueprint registry for this location.</p>
          </div>
        )}
      </div>
    </EngineerLayout>
  );
}
