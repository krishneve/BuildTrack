const Notification = require('../models/Notification');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// GET /notifications — user's own notifications
const getMyNotifications = async (req, res) => {
  try {
    const { unreadOnly, page = 1, limit = 30 } = req.query;
    const query = { recipient: req.user._id };
    if (unreadOnly === 'true') query.isRead = false;

    const total = await Notification.countDocuments(query);
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const unreadCount = await Notification.countDocuments({ recipient: req.user._id, isRead: false });

    return res.json({
      success: true,
      data: notifications,
      meta: { total, unreadCount, page: +page, limit: +limit },
    });
  } catch (err) {
    return sendError(res, 'Failed', 500);
  }
};

// PUT /notifications/:id/read
const markRead = async (req, res) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { isRead: true, readAt: new Date() }
    );
    return sendSuccess(res, null, 'Marked as read');
  } catch (err) {
    return sendError(res, 'Failed', 500);
  }
};

// PUT /notifications/read-all
const markAllRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { isRead: true, readAt: new Date() }
    );
    return sendSuccess(res, null, 'All notifications marked as read');
  } catch (err) {
    return sendError(res, 'Failed', 500);
  }
};

// GET /notifications/unread-count
const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({ recipient: req.user._id, isRead: false });
    return sendSuccess(res, { count });
  } catch (err) {
    return sendError(res, 'Failed', 500);
  }
};

module.exports = { getMyNotifications, markRead, markAllRead, getUnreadCount };
