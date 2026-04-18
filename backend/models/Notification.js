// models/Notification.js — In-app + push notifications
const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  site:      { type: mongoose.Schema.Types.ObjectId, ref: 'Site', default: null },

  type: {
    type: String,
    enum: [
      'attendance_pending',    // manager: new attendance to approve
      'attendance_approved',   // engineer: attendance approved
      'attendance_rejected',   // engineer: attendance rejected
      'payment_pending',       // manager: payment awaiting approval
      'payment_approved',      // payee: payment approved
      'payment_rejected',      // payee: payment rejected
      'invoice_pending',       // manager: new invoice uploaded
      'invoice_approved',      // uploader: invoice approved
      'low_stock',             // manager/engineer: material below threshold
      'budget_alert',          // admin/manager: budget >80%
      'budget_overrun',        // admin: budget >100%
      'system',                // generic system message
    ],
    required: true,
  },

  title:   { type: String, required: true },
  message: { type: String, required: true },
  data:    { type: mongoose.Schema.Types.Mixed, default: {} },  // extra payload

  isRead: { type: Boolean, default: false },
  readAt: { type: Date, default: null },

  // FCM push token delivery
  fcmToken:   { type: String, default: null },
  pushedAt:   { type: Date, default: null },
  pushStatus: { type: String, enum: ['pending', 'sent', 'failed', 'skipped'], default: 'pending' },
}, { timestamps: true });

NotificationSchema.index({ recipient: 1, isRead: 1 });
NotificationSchema.index({ recipient: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', NotificationSchema);
