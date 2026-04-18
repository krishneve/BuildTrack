const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');
const { restrictTo, siteAccess } = require('../middleware/rbac');
const ctrl = require('../controllers/workerController');
const { ROLES } = require('../config/constants');

router.use(protect, restrictTo(ROLES.ADMIN, ROLES.SITE_MANAGER));

router.get('/stats',         siteAccess, ctrl.getWorkerStats);
router.get('/',              siteAccess, ctrl.getWorkers);
router.get('/:id',                       ctrl.getWorkerById);
router.post('/',             siteAccess, ctrl.createWorker);
router.put('/:id',                       ctrl.updateWorker);
router.delete('/:id',                    ctrl.deleteWorker);
router.post('/:id/payment',              ctrl.createWorkerPayment);

module.exports = router;
