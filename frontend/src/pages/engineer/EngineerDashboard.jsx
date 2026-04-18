import React, { useState, useEffect, useCallback } from 'react';
import EngineerLayout from '../../components/layout/EngineerLayout';
import { engineerService } from '../../services/engineerService';
import { aiService } from '../../services/aiService';
import { useAuth } from '../../context/AuthContext';

function StatCard({ label, value, sub, accent, icon }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 relative group hover:border-emerald-500/50 transition-all">
      <div className="flex justify-between items-start mb-2">
        <div className="text-xs text-slate-500 uppercase tracking-wider">{label}</div>
        <div className="text-xl opacity-20">{icon}</div>
      </div>
      <div className={`text-3xl font-bold ${accent || 'text-white'}`}>{value}</div>
      {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
    </div>
  );
}

export default function EngineerDashboard() {
  const { user } = useAuth();
  const siteId = user?.primarySite?._id || user?.primarySite;
  const [data, setData] = useState(null);
  const [aiData, setAiData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceMsg, setAttendanceMsg] = useState('');

  const fetchData = useCallback(() => {
    if (!siteId) { setLoading(false); return; }
    setLoading(true);
    
    Promise.all([
      engineerService.getHome(siteId),
      aiService.getDashboard(siteId)
    ])
    .then(([home, ai]) => {
      setData(home.data.data);
      setAiData(ai.data.data);
    })
    .catch(err => setError(err.response?.data?.message || 'Failed to load field operations'))
    .finally(() => setLoading(false));
  }, [siteId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAttendance = async (type) => {
    setAttendanceLoading(true);
    setAttendanceMsg('');
    try {
      const res = await engineerService.markAttendance({ siteId, type });
      setAttendanceMsg(res.data.message || `${type === 'in' ? 'Check-in' : 'Check-out'} recorded!`);
      fetchData();
    } catch (err) {
      setAttendanceMsg(err.response?.data?.message || 'Failed to mark attendance');
    } finally {
      setAttendanceLoading(false);
    }
  };

  if (loading) return (
    <EngineerLayout>
      <div className="flex items-center justify-center h-64 text-slate-500 text-sm">Synchronizing field data...</div>
    </EngineerLayout>
  );

  if (error || !data) return (
    <EngineerLayout>
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <div className="text-red-400 mb-2">{error || 'No site context found'}</div>
        <button onClick={fetchData} className="text-xs text-emerald-500 underline mt-2">Retry Link</button>
      </div>
    </EngineerLayout>
  );

  return (
    <EngineerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Field Operations Overview</h1>
            <p className="text-slate-500 text-sm mt-0.5">{data.site?.name} • Tactical Node Tracking</p>
          </div>
          <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-500 font-bold border border-emerald-500/20">
            E
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Inventory Items" value={data.stock?.totalItems || 0} sub="In local stock" icon="📦" />
          <StatCard 
            label="Low Stock Alerts" 
            value={data.stock?.lowStockCount || 0} 
            accent={data.stock?.lowStockCount > 0 ? 'text-red-400' : 'text-white'}
            sub="Items below threshold"
            icon="⚠"
          />
          <StatCard label="Daily Ops Logs" value={data.today?.materialLogs || 0} sub="Actions today" icon="📋" />
          <StatCard label="Site Invoices" value={data.today?.invoicesUploaded || 0} sub="Uploaded today" icon="◻" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* AI Insights - Replaced with standardized cards */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
               <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6">Tactical Field Insights</h2>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(aiData?.insights || []).length > 0 ? aiData.insights.slice(0, 4).map((insight, idx) => (
                    <div key={idx} className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                       <div className="flex items-center gap-3 mb-2">
                          <span className="text-xl">{insight.emoji}</span>
                          <span className={`text-[10px] font-bold uppercase tracking-widest ${insight.severity === 'high' ? 'text-red-400' : 'text-emerald-400'}`}>{insight.title}</span>
                       </div>
                       <p className="text-xs text-slate-400 leading-relaxed">{insight.message}</p>
                    </div>
                  )) : (
                    <div className="col-span-2 text-center py-8 text-slate-600 text-xs italic">No tactical anomalies detected.</div>
                  )}
               </div>
            </div>

            {/* Site Progress */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
               <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase">Construction Progress</span>
                  <span className="text-sm font-bold text-white">{data.site?.progressPercent}%</span>
               </div>
               <div className="w-full bg-slate-800 rounded-full h-1.5">
                  <div className="h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" style={{ width: `${data.site.progressPercent}%` }} />
               </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
             {/* Attendance Log */}
             <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">Daily Presence</h2>
                <div className="space-y-3">
                   <button 
                      onClick={() => handleAttendance('in')}
                      disabled={attendanceLoading || data.today.checkedIn}
                      className={`w-full py-2.5 rounded-lg text-xs font-bold transition-all ${
                         data.today.checkedIn ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                      }`}
                   >
                       {data.today.checkedIn ? 'Verified Check-In' : 'Confirm Check-In'}
                   </button>
                   <button 
                      onClick={() => handleAttendance('out')}
                      disabled={attendanceLoading || !data.today.checkedIn || data.today.checkedOut}
                      className={`w-full py-2.5 rounded-lg text-xs font-bold transition-all ${
                         data.today.checkedOut || !data.today.checkedIn ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : 'bg-slate-800 text-white hover:bg-slate-700'
                      }`}
                   >
                       {data.today.checkedOut ? 'Verified Check-Out' : 'Confirm Check-Out'}
                   </button>
                </div>
                {attendanceMsg && <div className="mt-4 text-[10px] text-center text-emerald-500 font-semibold">{attendanceMsg}</div>}
             </div>

             {/* Recent Site Feed */}
             <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Tactical Feed</h2>
                <div className="space-y-4">
                   {(data.recentLogs || []).map((log, i) => (
                      <div key={i} className="flex gap-3">
                         <div className={`w-0.5 h-8 rounded-full ${log.type === 'in' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                         <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                               <span className="text-xs font-bold text-white truncate">{log.material}</span>
                               <span className={`text-xs font-bold ${log.type === 'in' ? 'text-emerald-400' : 'text-red-400'}`}>
                                  {log.type === 'in' ? '+' : '-'}{log.quantity}
                               </span>
                            </div>
                            <div className="text-[10px] text-slate-600 mt-1 uppercase font-bold">{new Date(log.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                         </div>
                      </div>
                   ))}
                   {(data.recentLogs || []).length === 0 && <div className="text-center py-4 text-slate-700 text-xs italic">Standby...</div>}
                </div>
             </div>
          </div>
        </div>
      </div>
    </EngineerLayout>
  );
}
