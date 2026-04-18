import React, { useState, useEffect, useCallback } from 'react';
import EngineerLayout from '../../components/layout/EngineerLayout';
import { engineerService } from '../../services/engineerService';
import { useAuth } from '../../context/AuthContext';

export default function EngineerLogs() {
  const { user } = useAuth();
  const siteId = user?.primarySite?._id || user?.primarySite;
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);

  const fetchLogs = useCallback(() => {
    if (!siteId) { setLoading(false); return; }
    setLoading(true);
    engineerService.getMyLogs(siteId, days)
      .then(r => setLogs(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [siteId, days]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const inCount = logs.filter(l => l.type === 'in').length;
  const outCount = logs.filter(l => l.type === 'out').length;

  const grouped = {};
  logs.forEach(log => {
    const dateKey = new Date(log.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(log);
  });

  return (
    <EngineerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <h1 className="text-2xl font-bold text-white">Operational Register</h1>
            <p className="text-slate-500 text-sm mt-0.5">{logs.length} actions recorded in window</p>
          </div>
          <div className="flex gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
            {[7, 14, 30].map(d => (
              <button key={d} onClick={() => setDays(d)}
                className={`px-4 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${
                  days === d ? 'bg-amber-500 text-slate-900 shadow-sm' : 'text-slate-500 hover:text-white'
                }`}>{d} Days</button>
            ))}
          </div>
        </div>

        {/* Metrics Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <MetricCard label="Total Activities" value={logs.length} />
          <MetricCard label="Material Intake" value={`+${inCount}`} accent="text-emerald-400" />
          <MetricCard label="Stock Outflow" value={`-${outCount}`} accent="text-red-400" />
        </div>

        {loading ? (
           <div className="space-y-4">
              {[1,2,3].map(i => <div key={i} className="h-20 bg-slate-900 animate-pulse border border-slate-800 rounded-xl" />)}
           </div>
        ) : logs.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-20 text-center">
             <p className="text-slate-500 text-sm font-bold uppercase tracking-widest leading-loose">No operational data detected</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(grouped).map(([date, dayLogs]) => (
              <div key={date} className="animate-fade-in">
                <div className="text-[10px] text-slate-500 uppercase tracking-[0.3em] font-bold mb-4 flex items-center gap-4">
                   <span className="w-8 h-px bg-slate-800"></span>
                   {date}
                </div>
                <div className="space-y-3">
                  {dayLogs.map(log => (
                    <div key={log._id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between hover:border-slate-700 transition-all">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl bg-slate-950 border border-slate-800 ${
                           log.type === 'in' ? 'text-emerald-500' : 'text-red-500'
                        }`}>
                           {log.type === 'in' ? '📥' : '📤'}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white uppercase tracking-tight">
                            {log.material?.name || 'Manual Log'}
                            <span className="ml-2 opacity-50">{log.material?.emoji}</span>
                          </div>
                          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1 flex items-center gap-2">
                             <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-400">{log.material?.category || 'General'}</span>
                             <span>• Logged By {log.loggedBy?.name?.split(' ')[0] || 'SYSTEM'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-lg font-bold tracking-tight leading-none ${log.type === 'in' ? 'text-emerald-500' : 'text-red-500'}`}>
                          {log.type === 'in' ? '+' : '-'}{log.quantity} <span className="text-[10px] font-normal text-slate-600 ml-1">{log.material?.unit}</span>
                        </div>
                        <div className="text-[9px] text-slate-600 font-bold uppercase tracking-widest mt-1">
                          {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </EngineerLayout>
  );
}

function MetricCard({ label, value, accent }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{label}</div>
      <div className={`text-2xl font-bold ${accent || 'text-white'}`}>{value}</div>
    </div>
  );
}
