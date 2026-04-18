const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');
const { siteAccess } = require('../middleware/rbac');
const ctrl = require('../controllers/reportController');

router.use(protect);

// All roles can download reports for their assigned site
router.get('/site-summary',       siteAccess, ctrl.generateSiteSummary);
router.get('/payment-register',   siteAccess, ctrl.generatePaymentRegister);
router.get('/invoice-summary',    siteAccess, ctrl.generateInvoiceSummary);

module.exports = router;
