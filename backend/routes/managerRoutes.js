const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');
const { restrictTo, siteAccess } = require('../middleware/rbac');
const ctrl = require('../controllers/managerController');
const { ROLES } = require('../config/constants');

router.use(protect, restrictTo(ROLES.ADMIN, ROLES.SITE_MANAGER));

router.get('/dashboard',                  siteAccess, ctrl.getDashboard);
router.get('/reports/site-summary',       siteAccess, ctrl.getSiteSummary);
router.get('/reports/worker-productivity',siteAccess, ctrl.getWorkerProductivity);

module.exports = router;
