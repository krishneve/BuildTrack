import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import { siteService } from '../../services/siteService';
import AdminLayout from '../../components/layout/AdminLayout';

function formatL(n) {
  if (!n) return '₹0';
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)} L`;
  return `₹${Number(n).toLocaleString()}`;
}

export default function SiteAnalytics() {
  const { id } = useParams();
  const [site, setSite] = useState(null);
  const [budget, setBudget] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [sRes, bRes] = await Promise.all([
          siteService.getById(id),
          adminService.getCostComparison(), // We'll filter this for the specific site
        ]);
        setSite(sRes.data.data);
        const siteBudget = bRes.data.data.find(b => b.site === sRes.data.data.name);
        setBudget(siteBudget);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  if (loading) return <AdminLayout><div className="text-center py-20 text-slate-500 font-bold uppercase tracking-widest animate-pulse">Analyzing Site Data...</div></AdminLayout>;
  if (!site) return <AdminLayout><div className="text-center py-20 text-red-400">Site not found</div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs text-slate-500 font-bold uppercase tracking-widest mb-2">
          <Link to="/admin/sites" className="hover:text-amber-500 transition-colors">Sites</Link>
          <span>/</span>
          <span className="text-slate-300">{site.name}</span>
        </div>

        {/* Site Header */}
        <div className="flex items-end justify-between bg-slate-900/50 p-6 rounded-2xl border border-slate-800/50 backdrop-blur-sm">
          <div>
            <div className="text-[10px] text-amber-500 font-black uppercase tracking-[0.3em] mb-2">Site Analytics</div>
            <h1 className="text-4xl font-black text-white tracking-tight leading-none uppercase">{site.name}</h1>
            <div className="flex gap-4 mt-4">
               <div className="flex items-center gap-2">
                 <span className="text-slate-600">Site Code:</span>
                 <span className="text-slate-300 font-mono font-bold">{site.siteCode}</span>
               </div>
               <div className="flex items-center gap-2">
                 <span className="text-slate-600">Location:</span>
                 <span className="text-slate-300 font-bold">{site.location?.city}, {site.location?.state}</span>
               </div>
            </div>
          </div>
          <div className="text-right">
             <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Overall Progress</div>
             <div className="text-5xl font-black text-amber-500 leading-none">{site.metrics?.progressPercent || 0}%</div>
          </div>
        </div>

        {/* Rapid Insights Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Budget Utilized', value: `${budget?.percentConsumed || 0}%`, sub: `${formatL(budget?.totalSpent)} / ${formatL(budget?.totalBudget)}` },
            { label: 'Labor Force', value: site.metrics?.totalWorkers || 0, sub: 'Active Personnel' },
            { label: 'Days Active', value: Math.floor((new Date() - new Date(site.startDate))/(1000*60*60*24)), sub: `Since ${new Date(site.startDate).toLocaleDateString()}` },
            { label: 'Materials Value', value: 'Live Stock', sub: 'Updated Real-time' },
          ].map(card => (
            <div key={card.label} className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-amber-500/30 transition-all group">
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-3 group-hover:text-amber-500 transition-colors">{card.label}</div>
              <div className="text-3xl font-black text-white">{card.value}</div>
              <div className="text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-wider">{card.sub}</div>
            </div>
          ))}
        </div>

        {/* Detailed Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           {/* Architectural Control */}
           <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 lg:col-span-2">
              <div className="flex items-center justify-between mb-8">
                 <h2 className="text-sm font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
                   <span className="text-amber-500">◆</span> Architectural Control
                 </h2>
                 <button className="text-[10px] font-black text-amber-500 uppercase tracking-widest border border-amber-500/30 px-3 py-1.5 rounded-lg hover:bg-amber-500/10 transition-all">
                   Manage Architects
                 </button>
              </div>

              {site.architects?.length > 0 ? (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                   {site.architects.map(arc => (
                     <div key={arc._id} className="bg-slate-950/40 rounded-2xl border border-slate-800 p-6 space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                           <div>
                              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Assigned Architect</div>
                              <div className="text-xl font-black text-white tracking-tight uppercase">{arc.name}</div>
                           </div>
                           <div className="text-right">
                              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Payment Status</div>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase ${
                                arc.payment?.status === 'paid' ? 'bg-green-500/20 text-green-400' : 
                                arc.payment?.status === 'partial' ? 'bg-amber-500/20 text-amber-500' : 'bg-red-500/20 text-red-400'
                              }`}>
                                {arc.payment?.status || 'Pending'}
                              </span>
                           </div>
                        </div>

                        {/* Drawing Checklist */}
                        <div className="space-y-4">
                           <div className="flex items-center justify-between">
                              <h3 className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Drawing Submission Checklist</h3>
                              <span className="text-[10px] text-amber-500 font-black">{arc.drawings?.filter(d => d.status === 'submitted').length || 0} / {arc.drawings?.length || 0}</span>
                           </div>
                           <div className="grid grid-cols-1 gap-2">
                              {arc.drawings?.length > 0 ? arc.drawings.map(dwg => (
                                <div key={dwg._id} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl border border-slate-800/50 group hover:border-slate-700 transition-all">
                                   <div className="flex items-center gap-3">
                                      <div className={`w-2 h-2 rounded-full ${dwg.status === 'submitted' ? 'bg-green-500' : 'bg-slate-700'}`} />
                                      <div>
                                         <div className="text-xs font-bold text-white">{dwg.name}</div>
                                         <div className="text-[10px] text-slate-500 flex gap-2">
                                            <span className="uppercase tracking-widest">{dwg.type || 'General'}</span>
                                            {dwg.submissionDate && <span>• {new Date(dwg.submissionDate).toLocaleDateString()}</span>}
                                         </div>
                                      </div>
                                   </div>
                                   <div className="flex items-center gap-3">
                                      <span className={`text-[9px] font-black uppercase tracking-widest ${dwg.status === 'submitted' ? 'text-green-500' : 'text-slate-600'}`}>
                                         {dwg.status}
                                      </span>
                                      {dwg.fileUrl && (
                                        <button className="text-amber-500 hover:text-amber-400 text-sm">↓</button>
                                      )}
                                   </div>
                                </div>
                              )) : (
                                <div className="text-center py-4 text-[10px] text-slate-600 font-bold uppercase italic">No drawings registered</div>
                              )}
                           </div>
                        </div>

                        {/* Payment Progress */}
                        <div className="pt-6 border-t border-slate-800">
                           <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                              <span className="text-slate-500">Financial Settlement</span>
                              <span className="text-white">{formatL(arc.payment?.paidAmount)} / {formatL(arc.payment?.totalAmount)}</span>
                           </div>
                           <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                              <div 
                                className="h-full bg-green-500 transition-all duration-700"
                                style={{ width: `${(arc.payment?.paidAmount / (arc.payment?.totalAmount || 1)) * 100}%` }}
                              />
                           </div>
                           <div className="mt-3 text-right">
                              <span className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">Balance: </span>
                              <span className="text-[11px] text-red-500 font-black">{formatL(arc.payment?.pendingAmount || (arc.payment?.totalAmount - arc.payment?.paidAmount))}</span>
                           </div>
                        </div>
                     </div>
                   ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-slate-950/50 rounded-2xl border-2 border-dashed border-slate-800">
                   <div className="text-slate-600 font-black uppercase tracking-widest mb-2">No Architect Assigned</div>
                   <p className="text-xs text-slate-700 font-bold">Assign an architect to start tracking drawings and payments.</p>
                </div>
              )}
           </div>

           {/* Financial Health */}
           <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h2 className="text-sm font-black text-white uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                <span className="text-amber-500">◆</span> Financial Health
              </h2>
              {budget ? (
                <div className="space-y-6">
                   <div>
                      <div className="flex justify-between text-[11px] font-black uppercase tracking-widest mb-2">
                        <span className="text-slate-400">Budget Consumption</span>
                        <span className={budget.budgetStatus === 'overrun' ? 'text-red-500' : 'text-amber-500'}>{budget.percentConsumed}%</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-1000 ${budget.budgetStatus === 'overrun' ? 'bg-red-500' : 'bg-amber-500'}`}
                          style={{ width: `${Math.min(budget.percentConsumed, 100)}%` }}
                        />
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Spent to Date</div>
                        <div className="text-xl font-black text-white">{formatL(budget.totalSpent)}</div>
                      </div>
                      <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Total Allocation</div>
                        <div className="text-xl font-black text-white">{formatL(budget.totalBudget)}</div>
                      </div>
                   </div>

                   <div className="space-y-3">
                      <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest border-b border-slate-800 pb-2">Category-wise Spend</div>
                      {budget.lineItems?.map(item => (
                        <div key={item.category} className="flex items-center justify-between py-1 px-2 hover:bg-slate-800/30 rounded transition-colors text-[11px] font-bold">
                          <span className="text-slate-400 uppercase tracking-widest">{item.category}</span>
                          <span className="text-white">{formatL(item.allocatedAmount)}</span>
                        </div>
                      ))}
                   </div>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-600 font-bold uppercase tracking-widest italic border-2 border-dashed border-slate-800 rounded-xl">No Budget Assigned</div>
              )}
           </div>

           {/* Site Logistics */}
           <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h2 className="text-sm font-black text-white uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                <span className="text-amber-500">◆</span> Site Logistics
              </h2>
              <div className="space-y-4">
                 {[
                   { label: 'Project Type', value: site.projectType, icon: '🏢' },
                   { label: 'Contact Person', value: site.manager?.name || 'Unassigned', icon: '👤' },
                   { label: 'Start Date', value: new Date(site.startDate).toLocaleDateString(), icon: '🗓' },
                   { label: 'Target End Date', value: new Date(site.expectedEndDate).toLocaleDateString(), icon: '🏁' },
                 ].map(item => (
                   <div key={item.label} className="bg-slate-950/30 p-4 rounded-xl border border-slate-800/50 flex items-center justify-between transition-colors hover:bg-slate-800/20 group">
                      <div className="flex items-center gap-3">
                        <span className="text-xl group-hover:scale-110 transition-transform">{item.icon}</span>
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{item.label}</span>
                      </div>
                      <span className="text-sm font-black text-white uppercase tracking-tight">{item.value}</span>
                   </div>
                 ))}
                 
                 <div className="mt-8 pt-6 border-t border-slate-800">
                    <div className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-4">Actions</div>
                    <div className="flex gap-4">
                       <Link to={`/admin/sites/${site._id}/edit`} className="flex-1 text-center py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-black uppercase text-[10px] tracking-widest rounded-xl border border-slate-700 transition-all">Edit Site Specs</Link>
                       <button className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black uppercase text-[10px] tracking-widest rounded-xl transition-all shadow-lg shadow-amber-500/10">Generate Report</button>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </AdminLayout>
  );
}
