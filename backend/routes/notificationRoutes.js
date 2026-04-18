const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const ctrl = require('../controllers/notificationController');

router.use(protect);

router.get('/',                ctrl.getMyNotifications);
router.get('/unread-count',    ctrl.getUnreadCount);
router.put('/read-all',        ctrl.markAllRead);
router.put('/:id/read',        ctrl.markRead);

module.exports = router;
