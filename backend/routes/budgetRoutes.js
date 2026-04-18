// routes/budgetRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { restrictTo } = require('../middleware/rbac');
const { getAllBudgets, createBudget, updateBudget, getBudgetSummary } = require('../controllers/budgetController');
const { ROLES } = require('../config/constants');

router.use(protect, restrictTo(ROLES.ADMIN));

router.route('/')
  .get(getAllBudgets)
  .post(createBudget);

router.route('/:siteId')
  .put(updateBudget);

router.get('/:siteId/summary', getBudgetSummary);

module.exports = router;
