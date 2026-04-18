import React from 'react';
import { Link } from 'react-router-dom';
import { useDashboard } from '../../hooks/useDashboard';
import AdminLayout from '../../components/layout/AdminLayout';

const STATUS_COLORS = {
  active: 'bg-green-500/20 text-green-400',
  planning: 'bg-blue-500/20 text-blue-400',
  on_hold: 'bg-yellow-500/20 text-yellow-400',
  completed: 'bg-slate-500/20 text-slate-400',
  cancelled: 'bg-red-500/20 text-red-400',
};

const BUDGET_COLORS = {
  on_track: 'bg-green-500',
  at_risk: 'bg-yellow-500',
  overrun: 'bg-red-500',
};

function StatCard({ label, value, sub, accent }) {
  return (
    <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-5 shadow-sm transition-all">
      <div className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-wider mb-2">{label}</div>
      <div className={`text-3xl font-bold ${accent || 'text-[var(--text-primary)]'}`}>{value}</div>
      {sub && <div className="text-[11px] text-[var(--text-secondary)] mt-1 font-medium">{sub}</div>}
    </div>
  );
}

function BudgetBar({ pct, status }) {
  return (
    <div className="w-full bg-[var(--bg-tertiary)] rounded-full h-1.5 mt-2 overflow-hidden">
      <div
        className={`h-1.5 rounded-full transition-all duration-700 ${BUDGET_COLORS[status] || 'bg-amber-500'}`}
        style={{ width: `${Math.min(pct, 100)}%` }}
      />
    </div>
  );
}

export default function AdminDashboard() {
  const { data, loading, error } = useDashboard();

  if (loading) return (
    <AdminLayout>
      <div className="flex items-center justify-center h-64 text-slate-500">Loading dashboard...</div>
    </AdminLayout>
  );

  if (error) return (
    <AdminLayout>
      <div className="flex items-center justify-center h-64 text-red-400">{error}</div>
    </AdminLayout>
  );

  const { siteStats, userStats, budgetStats, totalWorkers, sites = [] } = data || {};

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Company Overview</h1>
            <p className="text-[var(--text-secondary)] text-sm mt-0.5 font-medium">All sites · Real-time data</p>
          </div>
          <Link
            to="/admin/sites/new"
            className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold px-4 py-2 rounded-lg text-sm transition-all shadow-lg shadow-amber-500/10"
          >
            + New Site
          </Link>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Sites"
            value={siteStats?.total || 0}
            sub={`${siteStats?.active || 0} active`}
            accent="text-amber-400"
          />
          <StatCard
            label="Total Workers"
            value={totalWorkers?.toLocaleString() || 0}
            sub="Across all sites"
          />
          <StatCard
            label="Total Spent"
            value={`₹${((budgetStats?.totalSpent || 0) / 100000).toFixed(1)}L`}
            sub={`of ₹${((budgetStats?.totalBudgetAllocated || 0) / 100000).toFixed(1)}L budget`}
            accent={budgetStats?.overrunSites > 0 ? 'text-red-400' : 'text-white'}
          />
          <StatCard
            label="Team Members"
            value={userStats?.total || 0}
            sub={`${userStats?.managers || 0} managers · ${userStats?.engineers || 0} engineers`}
          />
        </div>

        {/* Budget Alert Banner */}
        {(budgetStats?.overrunSites > 0 || budgetStats?.atRiskSites > 0) && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-4">
            <span className="text-2xl">⚠</span>
            <div>
              <div className="text-red-500 font-bold text-xs uppercase tracking-widest">Budget Alert</div>
              <div className="text-[var(--text-secondary)] text-[10px] mt-0.5 font-bold">
                {budgetStats?.overrunSites > 0 && `${budgetStats.overrunSites} site(s) over budget. `}
                {budgetStats?.atRiskSites > 0 && `${budgetStats.atRiskSites} site(s) at risk (>80% consumed).`}
              </div>
            </div>
            <Link to="/admin/budget" className="ml-auto text-red-400 hover:text-red-300 text-xs underline">
              Review →
            </Link>
          </div>
        )}

        {/* Sites Grid */}
        <div>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
            All Sites
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {sites.map((site) => (
              <Link
                key={site._id}
                to={`/admin/sites/${site._id}`}
                className="bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:border-amber-500/50 rounded-xl p-5 transition-all group shadow-sm"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-[10px] text-[var(--text-secondary)] font-bold font-mono mb-1">{site.siteCode}</div>
                    <div className="font-bold text-[var(--text-primary)] text-sm group-hover:text-amber-500 transition-colors uppercase tracking-tight">
                      {site.name}
                    </div>
                    <div className="text-[10px] text-[var(--text-secondary)] font-bold mt-0.5">
                      {site.location?.city}, {site.location?.state}
                    </div>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full capitalize font-black ${STATUS_COLORS[site.status] || ''}`}>
                    {site.status?.replace('_', ' ')}
                  </span>
                </div>

                {/* Manager */}
                <div className="text-[10px] text-[var(--text-secondary)] font-bold mb-3">
                  Manager: <span className="text-[var(--text-primary)]">{site.manager?.name || 'Unassigned'}</span>
                </div>

                {/* Budget bar */}
                {site.budget ? (
                  <div>
                    <div className="flex justify-between text-[10px] font-bold">
                      <span className="text-[var(--text-secondary)] uppercase">Budget</span>
                      <span className={site.budget.status === 'overrun' ? 'text-red-500' : 'text-amber-500'}>
                        {site.budget.percentConsumed}%
                      </span>
                    </div>
                    <BudgetBar pct={site.budget.percentConsumed} status={site.budget.status} />
                    <div className="flex justify-between text-[10px] mt-1.5 font-bold">
                      <span className="text-[var(--text-secondary)]">₹{(site.budget.spent / 100000).toFixed(1)}L</span>
                      <span className="text-[var(--text-secondary)]">₹{(site.budget.total / 100000).toFixed(1)}L</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-[10px] text-[var(--text-secondary)] italic font-bold">No budget set</div>
                )}

                {/* Footer / Click Action */}
                <div className="mt-4 pt-3 border-t border-[var(--border-color)] flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-[10px] text-[var(--text-secondary)]">
                    <span className="text-amber-500">👷</span> {site.metrics?.totalWorkers || 0} Workers
                  </div>
                  <div className="flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                    <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">View Analytics →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
