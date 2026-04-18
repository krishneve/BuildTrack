// controllers/adminController.js
// Admin-specific: company-wide overview and analytics

const Site = require('../models/Site');
const User = require('../models/User');
const Budget = require('../models/Budget');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { ROLES, BUDGET_STATUS } = require('../config/constants');

// ──────────────────────────────────────────────
// GET /api/v1/admin/dashboard
// Company-wide overview stats for Admin dashboard
// ──────────────────────────────────────────────
const getDashboardOverview = async (req, res) => {
  try {
    const [sites, users, budgets] = await Promise.all([
      Site.find({ isActive: true }),
      User.find({ isActive: true }),
      Budget.find().populate('site', 'name status'),
    ]);

    // Site stats
    const siteStats = {
      total: sites.length,
      active: sites.filter((s) => s.status === 'active').length,
      planning: sites.filter((s) => s.status === 'planning').length,
      completed: sites.filter((s) => s.status === 'completed').length,
      onHold: sites.filter((s) => s.status === 'on_hold').length,
    };

    // Worker stats
    const totalWorkers = sites.reduce((acc, s) => acc + (s.metrics?.totalWorkers || 0), 0);

    // User stats by role
    const userStats = {
      total: users.length,
      admins: users.filter((u) => u.role === ROLES.ADMIN).length,
      managers: users.filter((u) => u.role === ROLES.SITE_MANAGER).length,
      engineers: users.filter((u) => u.role === ROLES.SITE_ENGINEER).length,
    };

    // Budget stats
    const totalBudget = budgets.reduce((acc, b) => acc + b.totalBudget, 0);
    const totalSpent = budgets.reduce((acc, b) => acc + b.totalSpent, 0);
    const budgetStats = {
      totalBudgetAllocated: totalBudget,
      totalSpent,
      totalRemaining: totalBudget - totalSpent,
      overrunSites: budgets.filter((b) => b.status === BUDGET_STATUS.OVERRUN).length,
      atRiskSites: budgets.filter((b) => b.status === BUDGET_STATUS.AT_RISK).length,
    };

    // Per-site summary for dashboard cards
    const siteSummaries = await Site.find({ isActive: true })
      .populate('manager', 'name email')
      .lean();

    const siteSummariesWithBudget = siteSummaries.map((site) => {
      const budget = budgets.find((b) => b.site?._id?.toString() === site._id.toString());
      return {
        _id: site._id,
        name: site.name,
        siteCode: site.siteCode,
        status: site.status,
        location: site.location,
        manager: site.manager,
        metrics: site.metrics,
        budget: budget
          ? {
              total: budget.totalBudget,
              spent: budget.totalSpent,
              remaining: budget.totalBudget - budget.totalSpent,
              percentConsumed: budget.totalBudget
                ? +((budget.totalSpent / budget.totalBudget) * 100).toFixed(1)
                : 0,
              status: budget.status,
            }
          : null,
      };
    });

    return sendSuccess(res, {
      siteStats,
      userStats,
      budgetStats,
      totalWorkers,
      sites: siteSummariesWithBudget,
    });
  } catch (err) {
    console.error(err);
    return sendError(res, 'Failed to fetch dashboard data', 500);
  }
};

// ──────────────────────────────────────────────
// GET /api/v1/admin/analytics/cost-comparison
// Site-by-site cost comparison data
// ──────────────────────────────────────────────
const getCostComparison = async (req, res) => {
  try {
    const { siteId } = req.query;
    const query = {};
    if (siteId && siteId !== 'all') query.site = siteId;

    const budgets = await Budget.find(query)
      .populate('site', 'name siteCode status')
      .lean();

    const data = budgets.map((b) => ({
      site: b.site?.name || 'Unknown',
      siteCode: b.site?.siteCode,
      status: b.site?.status,
      totalBudget: b.totalBudget,
      totalSpent: b.totalSpent,
      remaining: b.totalBudget - b.totalSpent,
      percentConsumed: b.totalBudget
        ? +((b.totalSpent / b.totalBudget) * 100).toFixed(1)
        : 0,
      budgetStatus: b.status,
      lineItems: b.lineItems,
    }));

    return sendSuccess(res, data);
  } catch (err) {
    return sendError(res, 'Failed to fetch cost comparison', 500);
  }
};

// ──────────────────────────────────────────────
// GET /api/v1/admin/analytics/overview
// ──────────────────────────────────────────────
const getAnalyticsOverview = async (req, res) => {
  try {
    const { siteId } = req.query;
    const siteQuery = { isActive: true };
    const budgetQuery = {};
    if (siteId && siteId !== 'all') {
      siteQuery._id = siteId;
      budgetQuery.site = siteId;
    }

    const sites = await Site.find(siteQuery).lean();
    const budgets = await Budget.find(budgetQuery).lean();

    const data = {
      totalSites: sites.length,
      totalBudget: budgets.reduce((a, b) => a + b.totalBudget, 0),
      totalSpent: budgets.reduce((a, b) => a + b.totalSpent, 0),
      totalWorkers: sites.reduce((a, s) => a + (s.metrics?.totalWorkers || 0), 0),
      averageProgress: sites.length
        ? +(sites.reduce((a, s) => a + (s.metrics?.progressPercent || 0), 0) / sites.length).toFixed(1)
        : 0,
    };

    return sendSuccess(res, data);
  } catch (err) {
    return sendError(res, 'Failed to fetch analytics', 500);
  }
};

module.exports = {
  getDashboardOverview,
  getCostComparison,
  getAnalyticsOverview,
};
