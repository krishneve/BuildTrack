// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { restrictTo } = require('../middleware/rbac');
const { getAllUsers, getUnassignedUsers, createUser, updateUser, deactivateUser } = require('../controllers/userController');
const { ROLES } = require('../config/constants');

router.use(protect, restrictTo(ROLES.ADMIN));

router.get('/unassigned', getUnassignedUsers);
router.route('/')
  .get(getAllUsers)
  .post(createUser);

router.route('/:id')
  .put(updateUser)
  .delete(deactivateUser);

module.exports = router;
