// controllers/managerController.js
// Manager-specific dashboard and reporting endpoints

const Worker     = require('../models/Worker');
const Attendance = require('../models/Attendance');
const Material   = require('../models/Material');
const Invoice    = require('../models/Invoice');
const Payment    = require('../models/Payment');
const Budget     = require('../models/Budget');
const Site       = require('../models/Site');
const Notification = require('../models/Notification');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// GET /manager/dashboard?siteId=
const getDashboard = async (req, res) => {
  try {
    const siteId = req.query.siteId || req.user.primarySite;
    if (!siteId) return sendError(res, 'No site assigned', 400);

    const today = new Date();
    const todayStart = new Date(today); todayStart.setHours(0,0,0,0);
    const todayEnd   = new Date(today); todayEnd.setHours(23,59,59,999);

    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    weekStart.setHours(0,0,0,0);

    const [
      site, budget,
      todayIn, todayOut,
      pendingAttendance, pendingInvoices, pendingPayments,
      totalWorkers, lowStock,
      weekPayments, unread,
    ] = await Promise.all([
      Site.findById(siteId).select('name status location metrics').lean(),
      Budget.findOne({ site: siteId }).lean(),
      Attendance.countDocuments({ site: siteId, type: 'in',  date: { $gte: todayStart, $lte: todayEnd } }),
      Attendance.countDocuments({ site: siteId, type: 'out', date: { $gte: todayStart, $lte: todayEnd } }),
      Attendance.countDocuments({ site: siteId, status: 'pending' }),
      Invoice.countDocuments({ site: siteId, status: 'pending' }),
      Payment.countDocuments({ site: siteId, status: 'pending' }),
      Worker.countDocuments({ site: siteId, isActive: true }),
      Material.countDocuments({ site: siteId, isActive: true, $expr: { $lte: ['$currentStock', '$minThreshold'] } }),
      Payment.find({ site: siteId, status: { $in: ['approved','paid'] }, createdAt: { $gte: weekStart } }).lean(),
      Notification.countDocuments({ recipient: req.user._id, isRead: false }),
    ]);

    const weeklySpend = weekPayments.reduce((a, p) => a + p.amount, 0);
    const budgetPct   = budget?.totalBudget ? +((budget.totalSpent / budget.totalBudget) * 100).toFixed(1) : 0;

    return sendSuccess(res, {
      site: { name: site?.name, status: site?.status, progressPercent: site?.metrics?.progressPercent || 0 },
      today: { checkedIn: todayIn, checkedOut: todayOut, totalWorkers },
      pending: {
        attendance: pendingAttendance,
        invoices:   pendingInvoices,
        payments:   pendingPayments,
        total:      pendingAttendance + pendingInvoices + pendingPayments,
      },
      budget: budget ? {
        total: budget.totalBudget, spent: budget.totalSpent,
        remaining: budget.totalBudget - budget.totalSpent,
        pct: budgetPct, status: budget.status,
      } : null,
      weeklySpend,
      lowStockCount: lowStock,
      unreadNotifications: unread,
    });
  } catch (err) {
    console.error(err);
    return sendError(res, 'Failed to load dashboard', 500);
  }
};

// GET /manager/reports/site-summary?siteId=
const getSiteSummary = async (req, res) => {
  try {
    const siteId = req.query.siteId || req.user.primarySite;

    const [workers, budget, materials, payments, invoices, site] = await Promise.all([
      Worker.find({ site: siteId, isActive: true }).lean(),
      Budget.findOne({ site: siteId }).lean(),
      Material.find({ site: siteId, isActive: true }).lean(),
      Payment.find({ site: siteId }).lean(),
      Invoice.find({ site: siteId }).lean(),
      Site.findById(siteId).lean(),
    ]);

    // Worker trade breakdown
    const tradeBreakdown = workers.reduce((acc, w) => {
      acc[w.trade] = (acc[w.trade] || 0) + 1;
      return acc;
    }, {});

    // Payment breakdown by type
    const approved = payments.filter(p => ['approved','paid'].includes(p.status));
    const paymentByType = ['weekly_labor','monthly_salary','advance','contractor','other'].map(t => ({
      type: t,
      count: approved.filter(p => p.type === t).length,
      amount: approved.filter(p => p.type === t).reduce((a, p) => a + p.amount, 0),
    }));

    // Material stock value
    const stockValue = materials.reduce((a, m) => a + m.currentStock * m.unitCost, 0);
    const lowStockItems = materials.filter(m => m.currentStock <= m.minThreshold);

    // Invoice summary
    const invApproved = invoices.filter(i => ['approved','paid'].includes(i.status));

    return sendSuccess(res, {
      site: { name: site?.name, status: site?.status, progress: site?.metrics?.progressPercent },
      workers: { total: workers.length, byTrade: tradeBreakdown },
      budget:  budget ? { total: budget.totalBudget, spent: budget.totalSpent, pct: budget.totalBudget ? +((budget.totalSpent/budget.totalBudget)*100).toFixed(1) : 0 } : null,
      materials: { totalItems: materials.length, lowStockCount: lowStockItems.length, stockValue: +stockValue.toFixed(0), lowStockItems },
      payments:  { totalApproved: approved.length, totalAmount: approved.reduce((a,p) => a+p.amount, 0), byType: paymentByType },
      invoices:  { total: invoices.length, approved: invApproved.length, approvedAmount: invApproved.reduce((a,i) => a+(i.totalAmount||0), 0) },
    });
  } catch (err) {
    return sendError(res, 'Failed to generate report', 500);
  }
};

// GET /manager/reports/worker-productivity?siteId=&days=7
const getWorkerProductivity = async (req, res) => {
  try {
    const siteId = req.query.siteId || req.user.primarySite;
    const days   = parseInt(req.query.days) || 7;
    const since  = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const attendance = await Attendance.find({
      site: siteId, status: 'approved', date: { $gte: since },
    }).lean();

    // Group by date
    const byDate = {};
    attendance.forEach(a => {
      const d = new Date(a.date).toLocaleDateString('en-IN');
      if (!byDate[d]) byDate[d] = { date: d, checkedIn: 0, checkedOut: 0 };
      if (a.type === 'in')  byDate[d].checkedIn++;
      if (a.type === 'out') byDate[d].checkedOut++;
    });

    const timeline = Object.values(byDate).sort((a, b) => new Date(a.date) - new Date(b.date));
    const avgPresent = timeline.length ? +(timeline.reduce((a, d) => a + d.checkedIn, 0) / timeline.length).toFixed(1) : 0;

    return sendSuccess(res, { days, timeline, avgPresent });
  } catch (err) {
    return sendError(res, 'Failed', 500);
  }
};

module.exports = { getDashboard, getSiteSummary, getWorkerProductivity };
