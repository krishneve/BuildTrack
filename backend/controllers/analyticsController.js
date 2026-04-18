const Site = require("../models/Site");
const User = require("../models/User");
const { sendSuccess, sendError } = require("../utils/response");

// ─── GET /api/admin/analytics/dashboard ──────────────────────────────────────
const getDashboardStats = async (req, res) => {
  try {
    const [siteStats, userStats, budgetStats] = await Promise.all([
      // Site aggregation
      Site.aggregate([
        { $match: { isDeleted: false } },
        {
          $group: {
            _id: null,
            totalSites: { $sum: 1 },
            activeSites: { $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] } },
            completedSites: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
            totalWorkers: { $sum: "$metrics.totalWorkers" },
            avgProgress: { $avg: "$progress" },
          },
        },
      ]),

      // User aggregation
      User.aggregate([
        {
          $group: {
            _id: "$role",
            count: { $sum: 1 },
            active: { $sum: { $cond: ["$isActive", 1, 0] } },
          },
        },
      ]),

      // Budget aggregation
      Site.aggregate([
        { $match: { isDeleted: false } },
        {
          $group: {
            _id: null,
            totalBudget: { $sum: "$budget.total" },
            totalSpent: { $sum: "$budget.spent" },
            overBudgetSites: {
              $sum: {
                $cond: [{ $gt: ["$budget.spent", "$budget.total"] }, 1, 0],
              },
            },
          },
        },
        {
          $addFields: {
            budgetUtilization: {
              $multiply: [
                { $divide: ["$totalSpent", { $ifNull: ["$totalBudget", 1] }] },
                100,
              ],
            },
          },
        },
      ]),
    ]);

    return sendSuccess(res, 200, "Dashboard stats fetched", {
      sites: siteStats[0] || {},
      users: userStats,
      budget: budgetStats[0] || {},
    });
  } catch (error) {
    console.error("getDashboardStats error:", error);
    return sendError(res, 500, "Failed to fetch dashboard stats.");
  }
};

// ─── GET /api/admin/analytics/site-comparison ────────────────────────────────
const getSiteComparison = async (req, res) => {
  try {
    const sites = await Site.find({ isDeleted: false })
      .select("name siteCode status progress budget metrics projectType")
      .lean();

    const comparison = sites.map((s) => ({
      id: s._id,
      name: s.name,
      siteCode: s.siteCode,
      status: s.status,
      progress: s.progress,
      projectType: s.projectType,
      budget: {
        total: s.budget.total,
        spent: s.budget.spent,
        remaining: s.budget.total - s.budget.spent,
        utilizationPct: s.budget.total
          ? ((s.budget.spent / s.budget.total) * 100).toFixed(1)
          : 0,
        isOverBudget: s.budget.spent > s.budget.total,
      },
      workers: s.metrics.totalWorkers,
    }));

    return sendSuccess(res, 200, "Site comparison fetched", { comparison });
  } catch (error) {
    return sendError(res, 500, "Failed to fetch site comparison.");
  }
};

// ─── GET /api/admin/analytics/budget-trends ──────────────────────────────────
const getBudgetTrends = async (req, res) => {
  try {
    // Aggregate budget changes over months from history
    const trends = await Site.aggregate([
      { $match: { isDeleted: false } },
      { $unwind: { path: "$budget.history", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: {
            month: { $month: "$budget.history.changedAt" },
            year: { $year: "$budget.history.changedAt" },
          },
          totalBudgetRevisions: { $sum: 1 },
          avgNewBudget: { $avg: "$budget.history.newAmount" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
      { $limit: 12 },
    ]);

    return sendSuccess(res, 200, "Budget trends fetched", { trends });
  } catch (error) {
    return sendError(res, 500, "Failed to fetch budget trends.");
  }
};

module.exports = { getDashboardStats, getSiteComparison, getBudgetTrends };
