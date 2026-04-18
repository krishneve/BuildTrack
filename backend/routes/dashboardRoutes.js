const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User     = require('../models/User');
const Site     = require('../models/Site');
const Budget   = require('../models/Budget');
const Attendance = require('../models/Attendance');
const Material   = require('../models/Material');
const Invoice    = require('../models/Invoice');
const Payment    = require('../models/Payment');
const Notification = require('../models/Notification');

router.use(protect);

// ── Engineer dashboard ──────────────────────────────────────────────────────
router.get('/engineer', async (req, res) => {
  try {
    const { siteId } = req.query;
    const id = siteId || req.user.primarySite;
    if (!id) return res.json({ success: true, data: null });

    const site = await Site.findById(id).select('name status location metrics').lean();
    if (!site) return res.json({ success: true, data: null });

    const todayStart = new Date(); todayStart.setHours(0,0,0,0);
    const todayEnd   = new Date(); todayEnd.setHours(23,59,59,999);

    const [todayAttendance, lowStock, pendingInvoices, unreadCount] = await Promise.all([
      Attendance.countDocuments({ site: id, date: { $gte: todayStart, $lte: todayEnd }, type: 'in' }),
      Material.countDocuments({ site: id, isActive: true, $expr: { $lte: ['$currentStock', '$minThreshold'] } }),
      Invoice.countDocuments({ site: id, status: 'pending' }),
      Notification.countDocuments({ recipient: req.user._id, isRead: false }),
    ]);

    return res.json({ success: true, data: {
      siteName: site.name, status: site.status,
      location: site.location, metrics: site.metrics,
      todayWorkers: todayAttendance,
      lowStockCount: lowStock,
      pendingInvoices,
      progressPercent: site.metrics?.progressPercent || 0,
      unreadNotifications: unreadCount,
    }});
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});

// ── Manager dashboard ───────────────────────────────────────────────────────
router.get('/manager', async (req, res) => {
  try {
    const { siteId } = req.query;
    const id = siteId || req.user.primarySite;
    if (!id) return res.json({ success: true, data: null });

    const site = await Site.findById(id).select('name status location metrics').lean();
    const budget = await Budget.findOne({ site: id }).lean();

    const todayStart = new Date(); todayStart.setHours(0,0,0,0);
    const todayEnd   = new Date(); todayEnd.setHours(23,59,59,999);

    const [todayWorkers, pendingAttendance, pendingPayments, lowStock, pendingInvoices] = await Promise.all([
      Attendance.countDocuments({ site: id, date: { $gte: todayStart, $lte: todayEnd }, type: 'in' }),
      Attendance.countDocuments({ site: id, status: 'pending' }),
      Payment.countDocuments({ site: id, status: 'pending' }),
      Material.countDocuments({ site: id, isActive: true, $expr: { $lte: ['$currentStock', '$minThreshold'] } }),
      Invoice.countDocuments({ site: id, status: 'pending' }),
    ]);

    const budgetPct = budget?.totalBudget
      ? +((budget.totalSpent / budget.totalBudget) * 100).toFixed(1) : 0;

    return res.json({ success: true, data: {
      siteName: site?.name, status: site?.status,
      progressPercent: site?.metrics?.progressPercent || 0,
      todayWorkers, pendingAttendance,
      pendingApprovals: pendingAttendance + pendingPayments + pendingInvoices,
      pendingPayments, pendingInvoices,
      lowStockCount: lowStock, budgetPct,
      budget: budget ? {
        total: budget.totalBudget, spent: budget.totalSpent,
        remaining: budget.totalBudget - budget.totalSpent, status: budget.status,
      } : null,
    }});
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});

module.exports = router;
