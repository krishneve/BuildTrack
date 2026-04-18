import React, { useState, useEffect } from 'react';
import { notificationService } from '../../services/notificationService';
import AdminLayout from '../../components/layout/AdminLayout';

const TYPE_ICONS = {
  attendance_pending: '✓', attendance_approved: '✓', attendance_rejected: '✗',
  payment_pending: '₹', payment_approved: '₹', payment_rejected: '₹',
  invoice_pending: '◻', invoice_approved: '◻',
  low_stock: '⚠', budget_alert: '⚠', budget_overrun: '🚨', system: '◉',
};
const TYPE_COLORS = {
  attendance_pending: 'text-yellow-400', attendance_approved: 'text-green-400', attendance_rejected: 'text-red-400',
  payment_approved: 'text-green-400', payment_rejected: 'text-red-400', payment_pending: 'text-yellow-400',
  low_stock: 'text-orange-400', budget_alert: 'text-orange-400', budget_overrun: 'text-red-400',
  invoice_pending: 'text-yellow-400', invoice_approved: 'text-green-400',
};

export default function Notifications() {
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
    <AdminLayout>
      <div className="space-y-5 max-w-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Notifications</h1>
            <p className="text-slate-500 text-sm mt-0.5">{notifications.filter(n => !n.isRead).length} unread</p>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
              <input type="checkbox" checked={unreadOnly} onChange={e => setUnreadOnly(e.target.checked)} className="accent-amber-500" />
              Unread only
            </label>
            <button onClick={markAllRead} className="text-xs text-amber-400 hover:text-amber-300">Mark all read</button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16 text-slate-500">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-600">
            {unreadOnly ? 'No unread notifications' : 'No notifications yet'}
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map(n => (
              <div
                key={n._id}
                onClick={() => !n.isRead && markRead(n._id)}
                className={`bg-slate-900 border rounded-xl p-4 cursor-pointer transition-all
                  ${n.isRead ? 'border-slate-800 opacity-60' : 'border-slate-700 hover:border-amber-500/30'}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`text-xl flex-shrink-0 mt-0.5 ${TYPE_COLORS[n.type] || 'text-slate-400'}`}>
                    {TYPE_ICONS[n.type] || '◉'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-semibold text-white text-sm">{n.title}</div>
                      {!n.isRead && <div className="w-2 h-2 bg-amber-500 rounded-full flex-shrink-0" />}
                    </div>
                    <div className="text-slate-400 text-xs mt-0.5">{n.message}</div>
                    <div className="text-slate-600 text-xs mt-1">
                      {new Date(n.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
