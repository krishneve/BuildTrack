// routes/siteRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { restrictTo } = require('../middleware/rbac');
const {
  getAllSites, getSiteById, createSite, updateSite,
  deleteSite, assignManager, assignEngineers
} = require('../controllers/siteController');
const { ROLES } = require('../config/constants');

router.use(protect, restrictTo(ROLES.ADMIN));

router.route('/')
  .get(getAllSites)
  .post(createSite);

router.route('/:id')
  .get(getSiteById)
  .put(updateSite)
  .delete(deleteSite);

router.post('/:id/assign-manager', assignManager);
router.post('/:id/assign-engineers', assignEngineers);

module.exports = router;
