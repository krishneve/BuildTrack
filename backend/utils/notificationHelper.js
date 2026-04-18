// utils/notificationHelper.js
// Creates in-app Notification records AND sends FCM push to mobile

const Notification = require('../models/Notification');
const User         = require('../models/User');
const { sendPush, sendMulticast } = require('./fcmHelper');

// ─── Core notify function ────────────────────────────────────────────────────
/**
 * Create notification record(s) and fire FCM push
 * @param {Array|Object} items
 */
const notify = async (items) => {
  try {
    const docs = Array.isArray(items) ? items : [items];
    const saved = await Notification.insertMany(docs, { ordered: false });

    // Push to each recipient's device
    for (const doc of saved) {
      if (!doc.recipient) continue;
      try {
        const user = await User.findById(doc.recipient).select('fcmToken').lean();
        if (!user?.fcmToken) continue;

        const result = await sendPush(
          user.fcmToken,
          doc.title,
          doc.message,
          { notificationId: doc._id.toString(), type: doc.type, siteId: doc.site?.toString() || '' }
        );

        // Update push status on the notification record
        await Notification.findByIdAndUpdate(doc._id, {
          fcmToken:   user.fcmToken,
          pushedAt:   result.success ? new Date() : null,
          pushStatus: result.success ? 'sent' : 'failed',
        });
      } catch (pushErr) {
        console.error('[notify] FCM push error for', doc.recipient, pushErr.message);
      }
    }
  } catch (err) {
    console.error('[notify] Failed:', err.message);
  }
};

// ─── Convenience builders ────────────────────────────────────────────────────

const notifyAttendancePending = (managerId, siteId, workerName) =>
  notify({
    recipient: managerId, site: siteId, type: 'attendance_pending',
    title: '✓ Attendance to Approve',
    message: `${workerName} has marked attendance. Tap to review.`,
    data: { workerName },
  });

const notifyAttendanceResult = (workerId, siteId, status) =>
  notify({
    recipient: workerId, site: siteId,
    type: status === 'approved' ? 'attendance_approved' : 'attendance_rejected',
    title: status === 'approved' ? '✅ Attendance Approved' : '❌ Attendance Rejected',
    message: status === 'approved'
      ? 'Your attendance has been approved by the site manager.'
      : 'Your attendance was rejected. Contact your manager.',
  });

const notifyInvoicePending = (managerId, siteId, uploaderName, amount) =>
  notify({
    recipient: managerId, site: siteId, type: 'invoice_pending',
    title: '◻ New Invoice Uploaded',
    message: `${uploaderName} uploaded ₹${Number(amount).toLocaleString('en-IN')} invoice. Tap to review.`,
    data: { uploaderName, amount: String(amount) },
  });

const notifyInvoiceResult = (uploaderId, siteId, status, invoiceNumber) =>
  notify({
    recipient: uploaderId, site: siteId,
    type: status === 'approved' ? 'invoice_approved' : 'invoice_pending',
    title: status === 'approved' ? '✅ Invoice Approved' : '❌ Invoice Rejected',
    message: `Invoice ${invoiceNumber || ''} has been ${status} by the manager.`,
  });

const notifyPaymentResult = (payeeId, siteId, status, amount) =>
  notify({
    recipient: payeeId, site: siteId,
    type: status === 'approved' ? 'payment_approved' : 'payment_rejected',
    title: status === 'approved' ? '✅ Payment Approved' : '❌ Payment Rejected',
    message: status === 'approved'
      ? `Your ₹${Number(amount).toLocaleString('en-IN')} payment was approved.`
      : 'Your payment was rejected. Contact your manager.',
    data: { amount: String(amount) },
  });

const notifyLowStock = (recipients, siteId, materialName, currentStock, unit) =>
  notify(recipients.map(r => ({
    recipient: r, site: siteId, type: 'low_stock',
    title: '⚠ Low Stock Alert',
    message: `${materialName}: only ${currentStock} ${unit} remaining.`,
    data: { materialName, currentStock: String(currentStock), unit },
  })));

const notifyBudgetAlert = (adminIds, siteId, siteName, pct) =>
  notify(adminIds.map(r => ({
    recipient: r, site: siteId,
    type: pct >= 100 ? 'budget_overrun' : 'budget_alert',
    title: pct >= 100 ? '🚨 Budget Overrun!' : '⚠ Budget Alert',
    message: `${siteName} consumed ${pct}% of its budget.`,
    data: { siteName, pct: String(pct) },
  })));

module.exports = {
  notify,
  notifyAttendancePending,
  notifyAttendanceResult,
  notifyInvoicePending,
  notifyInvoiceResult,
  notifyPaymentResult,
  notifyLowStock,
  notifyBudgetAlert,
};
