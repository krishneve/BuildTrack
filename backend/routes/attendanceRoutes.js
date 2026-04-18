const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { siteAccess } = require('../middleware/rbac');
const ctrl = require('../controllers/attendanceController');

router.use(protect);

router.post('/',           siteAccess, ctrl.markAttendance);
router.get('/today',       siteAccess, ctrl.getTodayAttendance);
router.get('/pending',     siteAccess, ctrl.getPendingApprovals);
router.put('/:id/status',             ctrl.updateStatus);
router.get('/my',                     ctrl.getMyHistory);
router.get('/summary',     siteAccess, ctrl.getDailySummary);

router.get('/workers',     siteAccess, ctrl.getWorkerAttendance);
router.post('/bulk',       siteAccess, ctrl.bulkMarkAttendance);
router.get('/report',      siteAccess, ctrl.getAttendanceReport);

module.exports = router;
