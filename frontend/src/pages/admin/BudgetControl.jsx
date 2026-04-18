import React, { useState, useEffect } from 'react';
import { budgetService } from '../../services/budgetService';
import { siteService } from '../../services/siteService';
import AdminLayout from '../../components/layout/AdminLayout';

const STATUS_CONFIG = {
  on_track: { label: 'On Track', color: 'text-green-400', bar: 'bg-green-500', badge: 'bg-green-500/20 text-green-400' },
  at_risk: { label: 'At Risk', color: 'text-yellow-400', bar: 'bg-yellow-500', badge: 'bg-yellow-500/20 text-yellow-400' },
  overrun: { label: 'Overrun', color: 'text-red-400', bar: 'bg-red-500', badge: 'bg-red-500/20 text-red-400' },
};

const CATEGORIES = ['materials', 'labor', 'equipment', 'overhead', 'contingency', 'other'];

function formatCrore(n) {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)} L`;
  return `₹${n?.toLocaleString()}`;
}

export default function BudgetControl() {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editBudget, setEditBudget] = useState(null);

  const fetchBudgets = async () => {
    setLoading(true);
    try {
      const { data } = await budgetService.getAll();
      setBudgets(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBudgets(); }, []);

  const totalAllocated = budgets.reduce((a, b) => a + b.totalBudget, 0);
  const totalSpent = budgets.reduce((a, b) => a + b.totalSpent, 0);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Budget Control</h1>
            <p className="text-slate-500 text-sm mt-0.5">Monitor and manage all site budgets</p>
          </div>
          <button
            onClick={() => { setEditBudget(null); setShowForm(true); }}
            className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold px-4 py-2 rounded-lg text-sm"
          >
            + Set Budget
          </button>
        </div>

        {/* Summary row */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Total Allocated</div>
            <div className="text-2xl font-bold text-white">{formatCrore(totalAllocated)}</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Total Spent</div>
            <div className="text-2xl font-bold text-amber-400">{formatCrore(totalSpent)}</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Remaining</div>
            <div className={`text-2xl font-bold ${totalAllocated - totalSpent < 0 ? 'text-red-400' : 'text-green-400'}`}>
              {formatCrore(totalAllocated - totalSpent)}
            </div>
          </div>
        </div>

        {/* Budget cards */}
        {loading ? (
          <div className="text-center py-16 text-slate-500">Loading budgets...</div>
        ) : budgets.length === 0 ? (
          <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-xl text-slate-600">
            No budgets set. Click "Set Budget" to create one.
          </div>
        ) : (
          <div className="space-y-4">
            {budgets.map(budget => {
              const pct = budget.totalBudget
                ? Math.min(+((budget.totalSpent / budget.totalBudget) * 100).toFixed(1), 100)
                : 0;
              const sc = STATUS_CONFIG[budget.status] || STATUS_CONFIG.on_track;
              return (
                <div key={budget._id} className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="text-xs text-slate-500 font-mono mb-1">{budget.site?.siteCode}</div>
                      <div className="font-semibold text-white">{budget.site?.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5 capitalize">{budget.site?.status?.replace('_', ' ')}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${sc.badge}`}>{sc.label}</span>
                      <button
                        onClick={() => { setEditBudget(budget); setShowForm(true); }}
                        className="text-xs text-amber-400 hover:text-amber-300 bg-amber-500/10 px-3 py-1 rounded-lg"
                      >
                        Revise
                      </button>
                    </div>
                  </div>

                  {/* Main bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-slate-300 font-medium">{formatCrore(budget.totalSpent)} spent</span>
                      <span className={`font-bold ${sc.color}`}>{pct}%</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all ${sc.bar}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs mt-1 text-slate-500">
                      <span>Total: {formatCrore(budget.totalBudget)}</span>
                      <span>Remaining: {formatCrore(budget.totalBudget - budget.totalSpent)}</span>
                    </div>
                  </div>

                  {/* Line items */}
                  {budget.lineItems?.length > 0 && (
                    <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-800">
                      {budget.lineItems.map(item => {
                        const itemPct = item.allocatedAmount
                          ? Math.min(+((item.spentAmount / item.allocatedAmount) * 100).toFixed(0), 100)
                          : 0;
                        return (
                          <div key={item._id} className="bg-slate-800/50 rounded-lg p-3">
                            <div className="text-xs text-slate-400 capitalize mb-1">{item.category}</div>
                            <div className="text-sm font-semibold text-white">{formatCrore(item.allocatedAmount)}</div>
                            <div className="w-full bg-slate-700 rounded-full h-1 mt-2">
                              <div className="h-1 rounded-full bg-amber-500/60" style={{ width: `${itemPct}%` }} />
                            </div>
                            <div className="text-xs text-slate-500 mt-1">{itemPct}% used</div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showForm && (
        <BudgetFormModal
          budget={editBudget}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); fetchBudgets(); }}
        />
      )}
    </AdminLayout>
  );
}

function BudgetFormModal({ budget, onClose, onSaved }) {
  const [sites, setSites] = useState([]);
  const [form, setForm] = useState({
    siteId: budget?.site?._id || '',
    totalBudget: budget?.totalBudget || '',
    financialYear: budget?.financialYear || '2024-25',
    reason: '',
    lineItems: budget?.lineItems || CATEGORIES.map(c => ({ category: c, allocatedAmount: '', spentAmount: 0 })),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const isEdit = !!budget;

  useEffect(() => {
    siteService.getAll({ limit: 100 }).then(({ data }) => setSites(data.data || []));
  }, []);

  const updateLineItem = (idx, field, val) => {
    const items = [...form.lineItems];
    items[idx] = { ...items[idx], [field]: val };
    setForm(f => ({ ...f, lineItems: items }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        totalBudget: Number(form.totalBudget),
        lineItems: form.lineItems
          .filter(i => i.allocatedAmount)
          .map(i => ({ ...i, allocatedAmount: Number(i.allocatedAmount), spentAmount: Number(i.spentAmount || 0) })),
      };
      if (isEdit) await budgetService.update(budget.site._id, payload);
      else await budgetService.create(payload);
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save budget');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <h2 className="text-lg font-semibold text-white">{isEdit ? 'Revise Budget' : 'Set Site Budget'}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">{error}</div>}

          {!isEdit && (
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Site *</label>
              <select
                value={form.siteId}
                onChange={e => setForm(f => ({ ...f, siteId: e.target.value }))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
                required
              >
                <option value="">Select site</option>
                {sites.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Total Budget (₹) *</label>
              <input
                type="number" value={form.totalBudget}
                onChange={e => setForm(f => ({ ...f, totalBudget: e.target.value }))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
                placeholder="5000000"
                min="1" required
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Financial Year</label>
              <input
                value={form.financialYear}
                onChange={e => setForm(f => ({ ...f, financialYear: e.target.value }))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
                placeholder="2024-25"
              />
            </div>
          </div>

          {isEdit && (
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Reason for revision *</label>
              <input
                value={form.reason}
                onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
                placeholder="e.g. Material cost increase"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-xs text-slate-400 mb-2">Budget Breakdown by Category</label>
            <div className="space-y-2">
              {form.lineItems.map((item, idx) => (
                <div key={item.category} className="flex items-center gap-3 bg-slate-800/50 rounded-lg px-3 py-2">
                  <span className="text-xs text-slate-400 capitalize w-24">{item.category}</span>
                  <input
                    type="number"
                    value={item.allocatedAmount}
                    onChange={e => updateLineItem(idx, 'allocatedAmount', e.target.value)}
                    className="flex-1 bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-white text-xs focus:outline-none focus:border-amber-500"
                    placeholder="Amount (₹)"
                    min="0"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-slate-800 text-slate-400 rounded-lg text-sm">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-lg text-sm disabled:opacity-50">
              {saving ? 'Saving...' : isEdit ? 'Update Budget' : 'Set Budget'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
