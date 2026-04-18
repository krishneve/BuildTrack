// controllers/budgetController.js
const Budget = require('../models/Budget');
const Site = require('../models/Site');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// GET /api/v1/admin/budgets
const getAllBudgets = async (req, res) => {
  try {
    const budgets = await Budget.find()
      .populate('site', 'name siteCode status location')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });
    return sendSuccess(res, budgets);
  } catch (err) {
    return sendError(res, 'Failed to fetch budgets', 500);
  }
};

// POST /api/v1/admin/budgets
const createBudget = async (req, res) => {
  try {
    const { siteId, totalBudget, lineItems, financialYear } = req.body;

    const site = await Site.findById(siteId);
    if (!site) return sendError(res, 'Site not found', 404);

    const existing = await Budget.findOne({ site: siteId });
    if (existing) return sendError(res, 'Budget already exists for this site. Use update instead.', 409);

    const budget = await Budget.create({
      site: siteId,
      totalBudget,
      lineItems: lineItems || [],
      financialYear,
      createdBy: req.user._id,
    });

    return sendSuccess(res, budget, 'Budget created successfully', 201);
  } catch (err) {
    return sendError(res, err.message || 'Failed to create budget', 400);
  }
};

// PUT /api/v1/admin/budgets/:siteId
const updateBudget = async (req, res) => {
  try {
    const { totalBudget, lineItems, reason } = req.body;

    const budget = await Budget.findOne({ site: req.params.siteId });
    if (!budget) return sendError(res, 'Budget not found for this site', 404);

    // Record revision
    if (totalBudget && totalBudget !== budget.totalBudget) {
      budget.revisions.push({
        revisedBy: req.user._id,
        previousTotal: budget.totalBudget,
        newTotal: totalBudget,
        reason: reason || 'Budget revision',
      });
      budget.totalBudget = totalBudget;
    }

    if (lineItems) budget.lineItems = lineItems;

    await budget.save();
    return sendSuccess(res, budget, 'Budget updated successfully');
  } catch (err) {
    return sendError(res, 'Failed to update budget', 500);
  }
};

// GET /api/v1/admin/budgets/:siteId/summary
const getBudgetSummary = async (req, res) => {
  try {
    const budget = await Budget.findOne({ site: req.params.siteId })
      .populate('site', 'name siteCode')
      .populate('revisions.revisedBy', 'name');

    if (!budget) return sendError(res, 'Budget not found', 404);

    const summary = {
      site: budget.site,
      totalBudget: budget.totalBudget,
      totalSpent: budget.totalSpent,
      remaining: budget.totalBudget - budget.totalSpent,
      percentConsumed: budget.totalBudget
        ? +((budget.totalSpent / budget.totalBudget) * 100).toFixed(1)
        : 0,
      status: budget.status,
      lineItems: budget.lineItems,
      revisions: budget.revisions,
      financialYear: budget.financialYear,
    };

    return sendSuccess(res, summary);
  } catch (err) {
    return sendError(res, 'Failed to fetch budget summary', 500);
  }
};

module.exports = { getAllBudgets, createBudget, updateBudget, getBudgetSummary };
