const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');
const { siteAccess, restrictTo } = require('../middleware/rbac');
const ctrl = require('../controllers/aiController');
const upload = require('../middleware/upload');

router.use(protect);

router.get('/predict-material/:siteId', siteAccess, ctrl.predictMaterial);
router.get('/cost-overrun/:siteId',     siteAccess, ctrl.costOverrun);
router.get('/anomaly/:siteId',          siteAccess, ctrl.anomalyDetection);
router.get('/smart-alerts/:siteId',     siteAccess, ctrl.smartAlerts);
router.get('/dashboard/:siteId',        siteAccess, ctrl.aiDashboard);
router.post('/detect-material', restrictTo('site_engineer', 'admin'), ctrl.detectMaterial);
router.post('/extract-invoice', restrictTo('site_manager', 'admin'), upload.single('invoice'), ctrl.extractInvoice);

module.exports = router;
