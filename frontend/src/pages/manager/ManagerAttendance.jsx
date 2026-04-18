import React, { useState, useEffect, useCallback } from 'react';
import ManagerLayout from '../../components/layout/ManagerLayout';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function ManagerAttendance() {
  const { user } = useAuth();
  const siteId = user?.primarySite?._id || user?.primarySite;
  const [activeTab, setActiveTab] = useState('workers'); // 'workers' or 'staff'
  const [loading, setLoading] = useState(true);
  
  // Staff Approvals State
  const [staffAttendances, setStaffAttendances] = useState([]);
  
  // Worker Roll Call State
  const [workers, setWorkers] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(() => {
    if (!siteId) return;
    setLoading(true);
    
    if (activeTab === 'staff') {
      api.get(`/attendance/today`, { params: { siteId } })
        .then(r => setStaffAttendances(r.data.data || []))
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      api.get(`/attendance/workers`, { params: { siteId, date: selectedDate } })
        .then(r => setWorkers(r.data.data || []))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [siteId, activeTab, selectedDate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleStatusChange = (workerId, newStatus) => {
    setWorkers(prev => prev.map(w => w._id === workerId ? { ...w, status: newStatus } : w));
  };

  const saveWorkerAttendance = async () => {
    setSaving(true);
    try {
      const records = workers.map(w => ({
        workerId: w._id,
        status: w.status === 'absent_default' ? 'absent' : w.status
      }));
      await api.post(`/attendance/bulk`, { siteId, date: selectedDate, records });
      alert('Attendance saved successfully');
      fetchData();
    } catch (err) {
      alert('Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  const approveStaff = async (id) => {
    try {
      await api.put(`/attendance/${id}/status`, { status: 'approved' });
      fetchData();
    } catch (err) {
      alert('Failed to approve');
    }
  };

  const exportAttendance = () => {
    // Generate CSV
    const headers = ['Worker Name', 'Trade', 'Status', 'Daily Wage', 'Date'];
    const rows = workers.map(w => [
      w.name,
      w.trade,
      w.status === 'absent_default' ? 'Absent' : w.status.toUpperCase(),
      w.wageAmount,
      selectedDate
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `attendance_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
  };

  const totalWages = workers
    .filter(w => w.status === 'present' || w.status === 'half_day')
    .reduce((sum, w) => sum + (w.status === 'half_day' ? w.wageAmount / 2 : w.wageAmount), 0);

  return (
    <ManagerLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-5">
          <div>
            <h1 className="text-2xl font-bold text-white">Attendance Management</h1>
            <p className="text-slate-500 text-sm mt-0.5">Track and approve daily logs for workers and staff</p>
          </div>
          
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button 
              onClick={() => setActiveTab('workers')}
              className={`px-5 py-2 rounded-lg text-xs font-semibold transition-all ${activeTab === 'workers' ? 'bg-amber-500 text-slate-900 shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              Worker Roll Call
            </button>
            <button 
              onClick={() => setActiveTab('staff')}
              className={`px-5 py-2 rounded-lg text-xs font-semibold transition-all ${activeTab === 'staff' ? 'bg-amber-500 text-slate-900 shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              Staff Approvals
            </button>
          </div>
        </div>

        {activeTab === 'workers' ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Select Date</label>
                <input 
                  type="date" 
                  value={selectedDate} 
                  onChange={e => setSelectedDate(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:border-amber-500 outline-none transition-all"
                />
              </div>
              
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-center">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Present Count</div>
                <div className="text-2xl font-bold text-white">
                  {workers.filter(w => w.status === 'present' || w.status === 'half_day').length} 
                  <span className="text-xs text-slate-500 ml-2">/ {workers.length} workers</span>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-center">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Estimated Wages</div>
                <div className="text-2xl font-bold text-white">₹{totalWages.toLocaleString()}</div>
              </div>

              <div className="flex gap-2 items-end">
                <button 
                  onClick={exportAttendance}
                  className="p-2.5 bg-slate-900 border border-slate-800 hover:border-slate-600 text-white rounded-xl transition-all"
                  title="Export CSV"
                >
                  📥
                </button>
                <button 
                  onClick={saveWorkerAttendance}
                  disabled={saving || loading}
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold text-sm rounded-xl transition-all shadow-lg shadow-amber-500/10 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Attendance'}
                </button>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-800/50 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-4 px-6 text-left">Worker Name</th>
                    <th className="py-4 px-6 text-center">Base Wage</th>
                    <th className="py-4 px-6 text-center">Status</th>
                    <th className="py-4 px-6 text-right">Today's Wage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {workers.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-20 text-center text-slate-600 italic">No workers found for this site.</td>
                    </tr>
                  ) : workers.map(w => (
                    <tr key={w._id} className="hover:bg-slate-800/30 transition-colors group">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center font-bold text-amber-500 group-hover:scale-105 transition-transform">
                            {w.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-white">{w.name}</div>
                            <div className="text-[10px] text-slate-500 uppercase tracking-wide mt-0.5">{w.trade.replace(/_/g,' ')}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="text-slate-400 font-medium italic">₹{w.wageAmount}</div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="inline-flex p-1 bg-slate-800 rounded-xl gap-1 border border-slate-700">
                          {[
                            { id: 'present', label: 'P', color: 'bg-emerald-500', full: 'Present' },
                            { id: 'half_day', label: 'H', color: 'bg-amber-500', full: 'Half' },
                            { id: 'absent', label: 'A', color: 'bg-red-500', full: 'Absent' }
                          ].map(opt => (
                            <button key={opt.id}
                              onClick={() => handleStatusChange(w._id, opt.id)}
                              className={`w-10 h-8 rounded-lg text-[10px] font-black transition-all flex items-center justify-center ${
                                w.status === opt.id 
                                ? `${opt.color} text-white shadow-lg shadow-${opt.color.split('-')[1]}-500/20` 
                                : 'text-slate-500 hover:text-white'
                              }`}
                              title={opt.full}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="font-bold text-white">
                          ₹{w.status === 'present' ? w.wageAmount : w.status === 'half_day' ? w.wageAmount / 2 : 0}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
               {staffAttendances.length === 0 ? (
                 <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-20 text-center">
                    <p className="text-slate-600 font-semibold uppercase tracking-widest text-[10px]">No staff attendance requests today</p>
                 </div>
               ) : staffAttendances.map(a => (
                 <div key={a._id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-center justify-between group hover:border-slate-600 transition-all gap-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-slate-800 rounded-xl flex items-center justify-center text-2xl shadow-inner">👤</div>
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-white text-lg">{a.worker?.name || 'Staff Member'}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${a.status === 'pending' ? 'bg-amber-500/20 text-amber-500' : 'bg-emerald-500/20 text-emerald-500'}`}>
                            {a.status}
                          </span>
                        </div>
                        <div className="text-[10px] font-bold text-slate-500 mt-1 flex items-center gap-3 uppercase tracking-wider">
                          <span className="text-amber-500 capitalize">{a.type}</span>
                          <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                          <span>{new Date(a.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    </div>
                    
                    {a.status === 'pending' && (
                      <button 
                        onClick={() => approveStaff(a._id)}
                        className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold text-xs px-6 py-3 rounded-lg transition-all shadow-lg shadow-amber-500/10 active:scale-95"
                      >
                        Approve
                      </button>
                    )}
                 </div>
               ))}
             </div>
          </div>
        )}
      </div>
    </ManagerLayout>
  );
}
