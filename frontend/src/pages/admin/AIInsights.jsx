import React, { useState, useEffect, useMemo } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import { aiService } from '../../services/aiService';
import { siteService } from '../../services/siteService';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

const SEV_CONFIG = {
  critical: { bg: 'bg-red-500/15 border-red-500/40',    badge: 'bg-red-500/20 text-red-400',    icon: '🚨' },
  high:     { bg: 'bg-orange-500/15 border-orange-500/40', badge: 'bg-orange-500/20 text-orange-400', icon: '⚠' },
  medium:   { bg: 'bg-yellow-500/15 border-yellow-500/40', badge: 'bg-yellow-500/20 text-yellow-400', icon: '⚡' },
  low:      { bg: 'bg-blue-500/15 border-blue-500/40',  badge: 'bg-blue-500/20 text-blue-400',   icon: 'ℹ' },
  info:     { bg: 'bg-slate-800 border-slate-700',      badge: 'bg-slate-700 text-slate-400',    icon: '●' },
};

function AlertCard({ alert }) {
  const cfg = SEV_CONFIG[alert.severity] || SEV_CONFIG.info;
  return (
    <div className={`border rounded-xl p-4 ${cfg.bg}`}>
      <div className="flex items-start gap-4">
        <span className="text-xl mt-0.5">{cfg.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-white text-sm uppercase tracking-tight">{alert.title}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest ${cfg.badge}`}>
              {alert.severity}
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed font-medium">{alert.message}</p>
        </div>
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload, label, unit }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg shadow-2xl">
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">{label}</p>
        <p className="text-sm font-bold text-amber-500">
          {payload[0].value} <span className="text-slate-400 font-normal">{unit}</span>
        </p>
      </div>
    );
  }
  return null;
}

export default function AIInsights() {
  const [sites,   setSites]   = useState([]);
  const [siteId,  setSiteId]  = useState('');
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [aiOnline, setAiOnline] = useState(null);
  const [selectedMatIdx, setSelectedMatIdx] = useState(0);

  useEffect(() => {
    siteService.getAll({ limit: 100 }).then(({ data: d }) => {
      setSites(d.data || []);
      if (d.data?.length) setSiteId(d.data[0]._id);
    });
  }, []);

  useEffect(() => {
    if (!siteId) return;
    setLoading(true);
    setData(null);
    setSelectedMatIdx(0);
    aiService.getDashboard(siteId)
      .then(({ data: d }) => {
        setData(d.data);
        setAiOnline(d.data?.aiStatus === 'online');
      })
      .catch(() => setAiOnline(false))
      .finally(() => setLoading(false));
  }, [siteId]);

  const alerts   = data?.alerts?.alerts || [];
  const forecast = data?.forecast?.predictions || [];
  const cost     = data?.costRisk;

  const currentMat = forecast[selectedMatIdx];

  const graphData = useMemo(() => {
    if (!currentMat?.next7Days) return [];
    return currentMat.next7Days.map(d => ({
      name: new Date(d.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' }),
      demand: d.predicted
    }));
  }, [currentMat]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
               🧠 Intelligence Node
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">Predictive analytics & neural anomaly detection</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg">
              <div className={`w-2 h-2 rounded-full ${aiOnline === null ? 'bg-slate-500' : aiOnline ? 'bg-green-400 animate-pulse' : 'bg-red-500'}`} />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                AI Service {aiOnline === null ? 'SYNC...' : aiOnline ? 'ONLINE' : 'OFFLINE'}
              </span>
            </div>
            <select value={siteId} onChange={e => setSiteId(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm font-bold text-white focus:outline-none focus:border-amber-500 transition-all cursor-pointer">
              {sites.map(s => <option key={s._id} value={s._id}>{s.name || 'Unknown Site'}</option>)}
            </select>
          </div>
        </div>

        {aiOnline === false && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex gap-4 items-center">
            <span className="text-2xl">🔌</span>
            <div>
               <div className="font-bold text-red-400 text-xs uppercase tracking-widest">Core Sync Failure</div>
               <div className="text-slate-500 text-[10px] mt-1 font-bold uppercase tracking-tight">AI Subsystem Offline • Localhost:8000 unreachable</div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-600">
             <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mb-4" />
             <div className="text-[10px] font-bold uppercase tracking-[0.2em]">Synthesizing Data Models...</div>
          </div>
        ) : data && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <div className="lg:col-span-2 space-y-6">
              {/* Main Graph Area */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                 <div className="flex items-center justify-between mb-8">
                    <div>
                       <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-1">Material Demand Matrix</h2>
                       <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">7-Day Forward Propagation</p>
                    </div>
                    {forecast.length > 0 && (
                       <select 
                          value={selectedMatIdx} 
                          onChange={e => setSelectedMatIdx(parseInt(e.target.value))}
                          className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-[10px] font-bold text-amber-500 uppercase tracking-widest outline-none focus:border-amber-500 transition-all"
                       >
                          {forecast.map((m, idx) => (
                             <option key={idx} value={idx}>{m.materialName} ({m.totalPredicted7d} {m.unit})</option>
                          ))}
                       </select>
                    )}
                 </div>

                 {forecast.length > 0 ? (
                    <div className="h-64 w-full">
                       <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={graphData}>
                             <defs>
                                <linearGradient id="colorDemand" x1="0" y1="0" x2="0" y2="1">
                                   <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                                   <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                                </linearGradient>
                             </defs>
                             <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                             <XAxis 
                                dataKey="name" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{fill: '#475569', fontSize: 10, fontWeight: 'bold'}}
                                dy={10}
                             />
                             <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{fill: '#475569', fontSize: 10, fontWeight: 'bold'}}
                             />
                             <Tooltip content={<CustomTooltip unit={currentMat.unit} />} />
                             <Area 
                                type="monotone" 
                                dataKey="demand" 
                                stroke="#f59e0b" 
                                strokeWidth={3}
                                fillOpacity={1} 
                                fill="url(#colorDemand)" 
                                animationDuration={1000}
                             />
                          </AreaChart>
                       </ResponsiveContainer>
                    </div>
                 ) : (
                    <div className="h-64 flex items-center justify-center text-slate-700 text-xs italic uppercase">Inert Data Stream • No forecasts available</div>
                 )}

                 <div className="mt-8 pt-6 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                        <div className="text-[9px] text-slate-500 font-bold uppercase mb-1">Stock Risk</div>
                        <div className={`text-xs font-bold uppercase ${
                           currentMat?.stockRisk === 'critical' ? 'text-red-400' :
                           currentMat?.stockRisk === 'high' ? 'text-orange-400' : 'text-emerald-400'
                        }`}>{currentMat?.stockRisk || 'STABLE'}</div>
                    </div>
                    <div>
                        <div className="text-[9px] text-slate-500 font-bold uppercase mb-1">7d Volume</div>
                        <div className="text-xs font-bold text-white">{currentMat?.totalPredicted7d} <span className="text-slate-600 font-normal">{currentMat?.unit}</span></div>
                    </div>
                    <div>
                        <div className="text-[9px] text-slate-500 font-bold uppercase mb-1">Stock Runout</div>
                        <div className="text-xs font-bold text-amber-500">{currentMat?.daysOfStockLeft === 999 ? '30+ Days' : `${currentMat?.daysOfStockLeft} Days`}</div>
                    </div>
                    <div>
                        <div className="text-[9px] text-slate-500 font-bold uppercase mb-1">Neural Trend</div>
                        <div className="text-xs font-bold text-white uppercase tracking-tighter">{currentMat?.trend || 'CONSTANT'}</div>
                    </div>
                 </div>
              </div>

              {/* Smart Alerts */}
              <div>
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                   <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                   Neural Discrepancies ({alerts.length})
                </h2>
                {alerts.length === 0 ? (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-10 text-center">
                    <div className="text-2xl mb-2">🛡</div>
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">No Operational Anomalies</div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {alerts.map((alert, i) => <AlertCard key={i} alert={alert} />)}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Cost analysis */}
            <div className="space-y-6">
              {cost && (
                <div className={`rounded-xl p-6 border transition-all ${SEV_CONFIG[cost.riskLevel]?.bg || 'bg-slate-900 border-slate-800 shadow-xl shadow-black/20'}`}>
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-6">Financial Orbit Analysis</div>
                  
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-slate-950 rounded-2xl flex items-center justify-center text-3xl shadow-inner border border-slate-800">
                      {SEV_CONFIG[cost.riskLevel]?.icon || '●'}
                    </div>
                    <div>
                      <div className={`text-2xl font-black uppercase tracking-tighter ${
                        cost.riskLevel === 'critical' ? 'text-red-400' :
                        cost.riskLevel === 'high'     ? 'text-orange-400' :
                        cost.riskLevel === 'medium'   ? 'text-yellow-400' : 'text-green-400'
                      }`}>{cost.riskLevel}</div>
                      <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Threat Level</div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between text-[10px] font-bold uppercase mb-2">
                        <span className="text-slate-500">Budget Consumed</span>
                        <span className="text-white">{cost.budget.pctConsumed}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800 shadow-inner">
                        <div className={`h-full rounded-full transition-all duration-1000 ${
                          cost.riskLevel === 'critical' ? 'bg-red-500' :
                          cost.riskLevel === 'high'     ? 'bg-orange-500' : 'bg-amber-500'
                        }`} style={{ width: `${Math.min(cost.budget.pctConsumed, 100)}%` }} />
                      </div>
                    </div>

                    <div className="space-y-2 pt-4 border-t border-slate-800">
                      {[
                        { label: 'Fiscal Allocation', val: `₹${(cost.budget.total / 100000).toFixed(2)}L` },
                        { label: 'Neutralized Value', val: `₹${(cost.budget.spent / 100000).toFixed(2)}L` },
                        { label: 'Orbit Projection',  val: `₹${(cost.projections.projectedTotal / 100000).toFixed(2)}L` },
                      ].map(row => (
                        <div key={row.label} className="flex justify-between text-[10px]">
                          <span className="text-slate-500 font-bold uppercase tracking-widest">{row.label}</span>
                          <span className="text-white font-bold">{row.val}</span>
                        </div>
                      ))}
                    </div>

                    {cost.projections.budgetExhaustionDate && (
                      <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg flex justify-between items-center group">
                        <span className="text-[10px] text-red-400/70 font-bold uppercase tracking-widest">Exhaustion Horizon</span>
                        <span className="text-xs text-red-400 font-black">{cost.projections.budgetExhaustionDate}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-8 space-y-2">
                    {cost.reasons?.map((r, i) => (
                      <div key={i} className="text-[10px] text-slate-400 font-medium leading-relaxed flex gap-2">
                        <span className="text-amber-500">›</span><span>{r}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Spending Velocity */}
              {cost?.spending && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
                   <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-6 underline decoration-amber-500 underline-offset-8">Monetary Flux</div>
                   <div className="space-y-4">
                      <div className="flex justify-between items-end">
                         <span className="text-xs text-slate-400 font-medium">7D Velocity</span>
                         <span className="text-sm font-bold text-white tracking-tighter">₹{(cost.spending.last7Days / 1000).toFixed(1)}K</span>
                      </div>
                      <div className="flex justify-between items-end">
                         <span className="text-xs text-slate-400 font-medium">Flux Status</span>
                         <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                            cost.spending.acceleration === 'accelerating' ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'
                         }`}>
                            {cost.spending.acceleration}
                         </span>
                      </div>
                   </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
