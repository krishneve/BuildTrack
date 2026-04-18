const express = require('express');
const router = express.Router();
const { login, refreshToken, logout } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/login', login);
router.post('/refresh', refreshToken);
router.post('/logout', protect, logout);

// PUT /auth/fcm-token — Register device push token (called from mobile on app start)
const User = require('../models/User');
router.put('/fcm-token', protect, async (req, res) => {
  try {
    const { fcmToken } = req.body;
    if (!fcmToken) return res.status(400).json({ success: false, message: 'fcmToken required' });
    await User.findByIdAndUpdate(req.user._id, { fcmToken });
    res.json({ success: true, message: 'FCM token registered' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed' });
  }
});

module.exports = router;
