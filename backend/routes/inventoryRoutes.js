const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { siteAccess } = require('../middleware/rbac');
const ctrl = require('../controllers/inventoryController');

router.use(protect);

router.get('/',            siteAccess, ctrl.getStock);
router.get('/materials',   siteAccess, ctrl.getMaterials);
router.post('/materials',  siteAccess, ctrl.createMaterial);
router.post('/log',        siteAccess, ctrl.logMaterial);
router.get('/logs',        siteAccess, ctrl.getLogs);
router.get('/alerts',      siteAccess, ctrl.getLowStockAlerts);
router.get('/summary',     siteAccess, ctrl.getInventorySummary);

module.exports = router;
