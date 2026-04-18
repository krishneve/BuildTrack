// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { restrictTo } = require('../middleware/rbac');
const { getDashboardOverview, getCostComparison, getAnalyticsOverview } = require('../controllers/adminController');
const { ROLES } = require('../config/constants');

// All admin routes require auth + admin role
router.use(protect, restrictTo(ROLES.ADMIN));

router.get('/dashboard', getDashboardOverview);
router.get('/analytics/overview', getAnalyticsOverview);
router.get('/analytics/cost-comparison', getCostComparison);

module.exports = router;
