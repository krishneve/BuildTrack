const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { siteAccess } = require('../middleware/rbac');
const ctrl = require('../controllers/paymentController');

router.use(protect);

router.get('/pending',     siteAccess, ctrl.getPending);
router.get('/summary',     siteAccess, ctrl.getPaymentSummary);
router.route('/')
  .get(siteAccess,  ctrl.getPayments)
  .post(siteAccess, ctrl.createPayment);
router.put('/:id/approve',             ctrl.approvePayment);
router.put('/:id/reject',              ctrl.rejectPayment);

module.exports = router;
