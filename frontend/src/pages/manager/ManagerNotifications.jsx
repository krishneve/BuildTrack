import React, { useState, useEffect } from 'react';
import ManagerLayout from '../../components/layout/ManagerLayout';
import { notificationService } from '../../services/notificationService';

const TYPE_ICONS = {
  attendance_pending: '✓', attendance_approved: '✓', attendance_rejected: '✗',
  payment_pending: '₹', payment_approved: '₹', payment_rejected: '₹',
  invoice_pending: '◻', invoice_approved: '◻',
  low_stock: '⚠', budget_alert: '⚠', budget_overrun: '🚨', system: '◉',
};
const TYPE_COLORS = {
  attendance_pending: 'text-amber-500', attendance_approved: 'text-emerald-500', attendance_rejected: 'text-red-500',
  payment_approved: 'text-emerald-500', payment_rejected: 'text-red-500', payment_pending: 'text-amber-500',
  low_stock: 'text-orange-500', budget_alert: 'text-orange-500', budget_overrun: 'text-red-500',
  invoice_pending: 'text-amber-500', invoice_approved: 'text-emerald-500',
};

export default function ManagerNotifications() {
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

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <ManagerLayout>
      <div className="space-y-6 max-w-2xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
             <h1 className="text-2xl font-bold text-white uppercase">Notifications</h1>
             <p className="text-xs text-slate-500 mt-1 font-medium tracking-wide">{unreadCount} unread pings in queue</p>
          </div>
          <div className="flex items-center gap-5">
            <label className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest cursor-pointer hover:text-white transition-colors">
              <input type="checkbox" checked={unreadOnly} onChange={e => setUnreadOnly(e.target.checked)} className="w-4 h-4 rounded-md border-slate-700 bg-slate-800 accent-amber-500" />
              Unread Only
            </label>
            <button onClick={markAllRead} className="text-[10px] font-bold text-amber-500 hover:text-amber-400 uppercase tracking-widest transition-all">Clear All</button>
          </div>
        </div>

        {loading ? (
             <div className="space-y-3">
                {[1,2,3,4].map(i => <div key={i} className="h-20 bg-slate-900/50 rounded-xl animate-pulse border border-slate-800"></div>)}
             </div>
        ) : notifications.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-16 text-center">
            <p className="text-slate-600 font-medium text-sm">
              {unreadOnly ? 'No unread notifications' : 'Your notificaiton inbox is empty'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map(n => (
              <div
                key={n._id}
                onClick={() => !n.isRead && markRead(n._id)}
                className={`bg-slate-900 border border-slate-800 rounded-xl p-4 cursor-pointer transition-all relative overflow-hidden group
                  ${n.isRead ? 'opacity-50' : 'hover:border-slate-600 shadow-lg'}`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-lg flex-shrink-0 group-hover:scale-105 transition-transform ${TYPE_COLORS[n.type] || 'text-slate-500'}`}>
                    {TYPE_ICONS[n.type] || '◉'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-bold text-white text-sm uppercase tracking-tight group-hover:text-amber-400 transition-colors">{n.title}</div>
                      {!n.isRead && <div className="w-2 h-2 bg-amber-500 rounded-full flex-shrink-0 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />}
                    </div>
                    <div className="text-slate-400 text-xs font-medium leading-relaxed mt-1">{n.message}</div>
                    <div className="text-slate-600 text-[9px] mt-3 font-bold uppercase tracking-widest">
                      {new Date(n.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
                {!n.isRead && <div className="absolute left-0 top-0 w-1 h-full bg-amber-500"></div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </ManagerLayout>
  );
}

