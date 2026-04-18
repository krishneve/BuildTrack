import React, { useState, useEffect } from 'react';
import { notificationService } from '../../services/notificationService';
import EngineerLayout from '../../components/layout/EngineerLayout';

const TYPE_ICONS = {
  attendance_pending: '✓', attendance_approved: '✓', attendance_rejected: '✗',
  payment_pending: '₹', payment_approved: '₹', payment_rejected: '₹',
  invoice_pending: '◻', invoice_approved: '◻',
  low_stock: '⚠', budget_alert: '⚠', budget_overrun: '🚨', system: '◉',
};

const TYPE_COLORS = {
  attendance_pending: 'text-amber-500', 
  attendance_approved: 'text-emerald-500', 
  attendance_rejected: 'text-red-500',
  payment_approved: 'text-emerald-500', 
  payment_rejected: 'text-red-500', 
  payment_pending: 'text-amber-500',
  low_stock: 'text-orange-500', 
  budget_alert: 'text-orange-500', 
  budget_overrun: 'text-red-500',
  invoice_pending: 'text-amber-500', 
  invoice_approved: 'text-emerald-500',
};

export default function EngineerNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadOnly, setUnreadOnly] = useState(false);

  const fetchAll = React.useCallback(() => {
    setLoading(true);
    notificationService.getAll({ unreadOnly: unreadOnly ? 'true' : 'false', limit: 50 })
      .then(({ data }) => setNotifications(data.data || []))
      .finally(() => setLoading(false));
  }, [unreadOnly]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const markAllRead = async () => {
    await notificationService.markAllRead();
    fetchAll();
  };

  const markRead = async (id) => {
    await notificationService.markRead(id);
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
  };

  return (
    <EngineerLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
           <div>
              <h1 className="text-2xl font-bold text-white">Alerts Hub</h1>
              <p className="text-slate-500 text-sm mt-0.5">{notifications.filter(n => !n.isRead).length} unread signals detected</p>
           </div>
           
           <div className="flex items-center gap-4">
              <button 
                 onClick={() => setUnreadOnly(!unreadOnly)}
                 className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                   unreadOnly ? 'bg-amber-500 text-slate-900 border-amber-500' : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-white'
                 }`}
              >
                 {unreadOnly ? 'Showing Unread' : 'All Alerts'}
              </button>
              <button onClick={markAllRead} className="text-[10px] font-bold text-slate-500 hover:text-white uppercase tracking-widest transition-all">
                 Clear All
              </button>
           </div>
        </div>

        {loading ? (
           <div className="space-y-3">
              {[1,2,3,4].map(i => <div key={i} className="h-20 bg-slate-900 border border-slate-800 rounded-xl animate-pulse" />)}
           </div>
        ) : notifications.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-20 text-center">
             <p className="text-slate-600 text-sm font-bold uppercase tracking-widest">Signal stream is static</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map(n => (
              <div
                key={n._id}
                onClick={() => !n.isRead && markRead(n._id)}
                className={`group relative overflow-hidden rounded-xl p-5 transition-all border cursor-pointer
                  ${n.isRead 
                    ? 'bg-slate-950 border-slate-900 opacity-60' 
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700 shadow-lg'}`}
              >
                <div className="flex items-start gap-5">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl bg-slate-950 border border-slate-800
                     ${n.isRead ? 'opacity-30' : TYPE_COLORS[n.type] || 'text-white'}`}>
                    {TYPE_ICONS[n.type] || '◉'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-4 mb-1">
                      <div className="font-bold text-white text-base truncate">{n.title}</div>
                      {!n.isRead && <div className="w-2 h-2 bg-amber-500 rounded-full flex-shrink-0 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />}
                    </div>
                    <div className="text-slate-400 text-xs font-medium leading-relaxed mb-2">{n.message}</div>
                    <div className="text-slate-600 text-[10px] font-bold uppercase tracking-widest">
                       {new Date(n.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </EngineerLayout>
  );
}
