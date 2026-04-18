import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ManagerLayout from '../../components/layout/ManagerLayout';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

function StatCard({ label, value, sub, accent, icon }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 relative overflow-hidden group hover:border-amber-500/50 transition-all">
      <div className="flex justify-between items-start mb-2">
        <div className="text-xs text-slate-500 uppercase tracking-wider">{label}</div>
        <div className="text-xl opacity-20 group-hover:opacity-40 transition-opacity">{icon}</div>
      </div>
      <div className={`text-3xl font-bold ${accent || 'text-white'}`}>{value}</div>
      {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
    </div>
  );
}

function ProgressCard({ label, value, color }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs text-slate-500 uppercase tracking-wider">{label}</span>
        <span className="text-xs font-bold text-white">{value}%</span>
      </div>
      <div className="w-full bg-slate-800 rounded-full h-1.5">
        <div
          className={`h-1.5 rounded-full transition-all ${color || 'bg-amber-500'}`}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
    </div>
  );
}

export default function ManagerDashboard() {
  const { user } = useAuth();
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const siteId = user?.primarySite?._id || user?.primarySite;

  useEffect(() => {
    if (!siteId) { setLoading(false); return; }
    setLoading(true);
    api.get('/manager/dashboard', { params: { siteId } })
      .then(r => setData(r.data.data))
      .catch(err => setError(err.response?.data?.message || 'Failed to load site data'))
      .finally(() => setLoading(false));
  }, [siteId]);

  if (loading) return (
    <ManagerLayout>
      <div className="flex items-center justify-center h-64 text-slate-500">Loading site overview...</div>
    </ManagerLayout>
  );

  if (error || !data) return (
    <ManagerLayout>
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <div className="text-red-400 mb-2">{error || 'No site context found'}</div>
        <div className="text-slate-500 text-sm">Please ensure you are assigned to a site.</div>
      </div>
    </ManagerLayout>
  );

  return (
    <ManagerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Site Control Center</h1>
            <p className="text-slate-500 text-sm mt-0.5">Managing {data.site?.name || 'Assigned Site'} • Real-time Monitoring</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs px-3 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full font-bold uppercase tracking-widest">
              Live Feed
            </span>
          </div>
        </div>

        {/* Top KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Workforce"
            value={data.today.checkedIn}
            sub={`of ${data.today.totalWorkers} total force`}
            icon="👷"
          />
          <StatCard
            label="Approvals"
            value={data.pending.total}
            sub="Items pending review"
            accent={data.pending.total > 0 ? 'text-amber-400' : 'text-white'}
            icon="⚖"
          />
          <StatCard
            label="Low Stock"
            value={data.lowStockCount}
            sub="Action suggested"
            accent={data.lowStockCount > 3 ? 'text-red-400' : 'text-white'}
            icon="📦"
          />
          <StatCard
            label="Weekly Spend"
            value={`₹${(data.weeklySpend / 1000).toFixed(1)}K`}
            sub="Current operational burn"
            icon="💸"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Context Area */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6">Financial & Progress Integrity</h2>
              
              <div className="space-y-8">
                <div>
                   <div className="flex justify-between items-end mb-2">
                      <div>
                         <div className="text-xs text-slate-500 uppercase mb-1">Budget Consumption</div>
                         <div className="text-2xl font-bold text-white">₹{(data.budget?.spent / 100000).toFixed(2)}L <span className="text-sm font-normal text-slate-500">of ₹{(data.budget?.total / 100000).toFixed(2)}L</span></div>
                      </div>
                      <span className={`text-xs font-bold ${data.budget?.status === 'overrun' ? 'text-red-400' : 'text-amber-400'}`}>{data.budget?.percentConsumed}%</span>
                   </div>
                   <div className="w-full bg-slate-800 rounded-full h-2">
                      <div className={`h-2 rounded-full transition-all ${data.budget?.status === 'overrun' ? 'bg-red-500' : 'bg-amber-500'}`} style={{ width: `${Math.min(data.budget?.percentConsumed || 0, 100)}%` }} />
                   </div>
                </div>

                <ProgressCard label="Site Construction Progress" value={data.site?.progressPercent || 0} />
              </div>

              <div className="grid grid-cols-2 gap-4 mt-10 pt-6 border-t border-slate-800">
                 <div>
                    <div className="text-xs text-slate-500 mb-1">Site Status</div>
                    <div className="text-sm font-bold text-white uppercase tracking-wider">{data.site?.status?.replace('_', ' ') || 'ACTIVE'}</div>
                 </div>
                 <div className="text-right">
                    <div className="text-xs text-slate-500 mb-1">Current Efficiency</div>
                    <div className="text-sm font-bold text-green-400">94.2%</div>
                 </div>
              </div>
            </div>

            {/* Quick Actions / Important Items */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link to="/manager/attendance" className="bg-slate-900 border border-slate-800 hover:border-amber-500/50 p-4 rounded-xl flex items-center justify-between group transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center text-lg">✓</div>
                  <div>
                    <div className="text-xs font-bold text-white">Attendance</div>
                    <div className="text-[10px] text-slate-500">{data.pending.attendance} pending</div>
                  </div>
                </div>
                <span className="text-slate-600 group-hover:text-amber-500 transition-colors">→</span>
              </Link>
              <Link to="/manager/invoices" className="bg-slate-900 border border-slate-800 hover:border-amber-500/50 p-4 rounded-xl flex items-center justify-between group transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center text-lg">◻</div>
                  <div>
                    <div className="text-xs font-bold text-white">Invoices</div>
                    <div className="text-[10px] text-slate-500">{data.pending.invoices} pending</div>
                  </div>
                </div>
                <span className="text-slate-600 group-hover:text-amber-500 transition-colors">→</span>
              </Link>
            </div>
          </div>

          {/* Right Sidebar - Active Information */}
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Pending Verifications</h2>
              <div className="space-y-4">
                 <div className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800">
                    <span className="text-xs text-slate-400">Worker Attendance</span>
                    <span className="text-xs font-bold text-amber-500">{data.pending.attendance}</span>
                 </div>
                 <div className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800">
                    <span className="text-xs text-slate-400">Supplier Invoices</span>
                    <span className="text-xs font-bold text-amber-500">{data.pending.invoices}</span>
                 </div>
                 <div className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800">
                    <span className="text-xs text-slate-400">Payout Requests</span>
                    <span className="text-xs font-bold text-amber-500">{data.pending.payments}</span>
                 </div>
              </div>
              
              <Link to="/manager/notifications" className="block w-full text-center mt-6 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-lg transition-colors">
                 View All Alerts
              </Link>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
               <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Site Location</h2>
               <div className="aspect-video bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-center text-xs text-slate-700 italic">
                  GPS MAP VIEW
               </div>
               <div className="mt-3">
                  <div className="text-xs font-bold text-white">{data.site?.location?.city || 'Site City'}</div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">{data.site?.location?.state || 'Site State'}</div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </ManagerLayout>
  );
}
