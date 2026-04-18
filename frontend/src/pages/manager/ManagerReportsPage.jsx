import React, { useState } from 'react';
import ManagerLayout from '../../components/layout/ManagerLayout';
import { useAuth } from '../../context/AuthContext';
import { reportService } from '../../services/reportService';

function ReportCard({ title, description, icon, onDownload, loading }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-start justify-between gap-4">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">{icon}</div>
        <div>
          <div className="font-semibold text-white">{title}</div>
          <div className="text-xs text-slate-500 mt-1">{description}</div>
        </div>
      </div>
      <button
        onClick={onDownload}
        disabled={loading}
        className="flex-shrink-0 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-900 text-xs font-bold px-4 py-2 rounded-lg transition-colors"
      >
        {loading ? 'Generating...' : '⬇ PDF'}
      </button>
    </div>
  );
}

export default function ManagerReportsPage() {
  const { user } = useAuth();
  const siteId = user?.primarySite?._id || user?.primarySite;
  const [loading, setLoading] = useState({});
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo,   setDateTo]   = useState('');
  const [error,    setError]    = useState('');

  const download = async (key, fn) => {
    setLoading(l => ({ ...l, [key]: true }));
    setError('');
    try { await fn(); }
    catch (err) { setError(`Failed to generate ${key} report. Try again.`); }
    finally { setLoading(l => ({ ...l, [key]: false })); }
  };

  return (
    <ManagerLayout>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold text-white">Reports</h1>
          <p className="text-slate-500 text-sm mt-0.5">Download PDF reports for your site</p>
        </div>

        {error && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">{error}</div>}

        <div className="space-y-3">
          <ReportCard
            title="Site Summary Report"
            description="Complete overview — budget, workers, materials, payments, invoices"
            icon="◈"
            loading={loading.summary}
            onDownload={() => download('summary', () => reportService.downloadSiteSummary(siteId))}
          />

          <div>
            <div className="flex gap-3 mb-3">
              <div className="flex-1">
                <label className="block text-xs text-slate-400 mb-1">From Date</label>
                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500" />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-slate-400 mb-1">To Date</label>
                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500" />
              </div>
            </div>
            <ReportCard
              title="Payment Register"
              description="All worker & contractor payments with status and method breakdown"
              icon="₹"
              loading={loading.payments}
              onDownload={() => download('payments', () => reportService.downloadPaymentRegister(siteId, dateFrom, dateTo))}
            />
          </div>

          <ReportCard
            title="Invoice Summary"
            description="All supplier invoices — approved, pending, and paid amounts"
            icon="◻"
            loading={loading.invoices}
            onDownload={() => download('invoices', () => reportService.downloadInvoiceSummary(siteId))}
          />
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs text-slate-500">
          <div className="font-semibold text-slate-400 mb-1">📌 About these reports</div>
          Reports are generated in real-time from live data. All amounts are in Indian Rupees (₹). Reports are marked confidential and intended for internal use only.
        </div>
      </div>
    </ManagerLayout>
  );
}
