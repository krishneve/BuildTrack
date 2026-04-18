import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import AdminLayout from '../../components/layout/AdminLayout';

function formatL(n) {
  if (!n) return '₹0';
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)} Cr`;
  return `₹${(n / 100000).toFixed(1)} L`;
}

export default function Analytics() {
  const [overview, setOverview] = useState(null);
  const [costData, setCostData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [ov, cc] = await Promise.all([
          adminService.getAnalyticsOverview(),
          adminService.getCostComparison(),
        ]);
        setOverview(ov.data.data);
        setCostData(cc.data.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const maxSpent = costData.length ? Math.max(...costData.map(s => s.totalBudget)) : 1;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-slate-500 text-sm mt-0.5">Company-wide performance & cost analysis</p>
        </div>

        {loading ? (
          <div className="text-center py-16 text-slate-500">Loading analytics...</div>
        ) : (
          <>
            {/* Overview cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Active Sites', value: overview?.totalSites || 0 },
                { label: 'Total Workers', value: overview?.totalWorkers?.toLocaleString() || 0 },
                { label: 'Total Spent', value: formatL(overview?.totalSpent) },
                { label: 'Avg Progress', value: `${overview?.averageProgress || 0}%` },
              ].map(card => (
                <div key={card.label} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                  <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">{card.label}</div>
                  <div className="text-2xl font-bold text-amber-400">{card.value}</div>
                </div>
              ))}
            </div>

            {/* Cost comparison chart */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h2 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">
                Site-by-Site Cost Comparison
              </h2>
              {costData.length === 0 ? (
                <div className="text-center py-8 text-slate-600">No budget data available</div>
              ) : (
                <div className="space-y-4">
                  {costData.map(site => (
                    <div key={site.site} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-300 font-medium">{site.site}</span>
                          <span className="text-slate-600 font-mono">{site.siteCode}</span>
                        </div>
                        <div className="flex items-center gap-4 text-slate-400">
                          <span>Spent: <span className="text-white">{formatL(site.totalSpent)}</span></span>
                          <span>Budget: <span className="text-white">{formatL(site.totalBudget)}</span></span>
                          <span className={`font-semibold ${
                            site.budgetStatus === 'overrun' ? 'text-red-400' :
                            site.budgetStatus === 'at_risk' ? 'text-yellow-400' : 'text-green-400'
                          }`}>{site.percentConsumed}%</span>
                        </div>
                      </div>
                      {/* Stacked bar: spent vs budget */}
                      <div className="w-full bg-slate-800 rounded-full h-4 relative overflow-hidden">
                        <div
                          className={`h-4 rounded-full transition-all ${
                            site.budgetStatus === 'overrun' ? 'bg-red-500' :
                            site.budgetStatus === 'at_risk' ? 'bg-yellow-500' : 'bg-amber-500'
                          }`}
                          style={{ width: `${(site.totalBudget / maxSpent) * 100}%`, opacity: 0.3 }}
                        />
                        <div
                          className={`h-4 rounded-full absolute top-0 left-0 transition-all ${
                            site.budgetStatus === 'overrun' ? 'bg-red-500' :
                            site.budgetStatus === 'at_risk' ? 'bg-yellow-500' : 'bg-amber-500'
                          }`}
                          style={{ width: `${(site.totalSpent / maxSpent) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Category breakdown table */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h2 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">
                Spend by Category
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 text-xs text-slate-500 uppercase tracking-wider">
                      <th className="text-left py-2">Site</th>
                      {['materials', 'labor', 'equipment', 'overhead', 'contingency'].map(c => (
                        <th key={c} className="text-right py-2 capitalize">{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {costData.map(site => (
                      <tr key={site.site} className="border-b border-slate-800/30 hover:bg-slate-800/20">
                        <td className="py-3 text-slate-300 font-medium">{site.site}</td>
                        {['materials', 'labor', 'equipment', 'overhead', 'contingency'].map(cat => {
                          const item = site.lineItems?.find(i => i.category === cat);
                          return (
                            <td key={cat} className="py-3 text-right text-slate-400 text-xs">
                              {item ? formatL(item.allocatedAmount) : <span className="text-slate-700">—</span>}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
