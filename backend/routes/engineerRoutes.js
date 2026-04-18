// routes/engineerRoutes.js
const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');
const { restrictTo, siteAccess } = require('../middleware/rbac');
const ctrl = require('../controllers/engineerController');
const { ROLES } = require('../config/constants');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');

// Multer for invoice photo uploads
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename:    (req, file, cb) => {
    const ext  = path.extname(file.originalname);
    const name = `inv-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    cb(null, name);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8 MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|pdf/;
    if (allowed.test(file.mimetype)) cb(null, true);
    else cb(new Error('Only images and PDFs allowed'));
  },
});

// Engineer + Admin can use these endpoints
router.use(protect, restrictTo(ROLES.ADMIN, ROLES.SITE_MANAGER, ROLES.SITE_ENGINEER));

router.get('/home',          siteAccess, ctrl.getHome);
router.get('/stock',         siteAccess, ctrl.getStock);
router.get('/my-logs',       siteAccess, ctrl.getMyLogs);
router.get('/my-invoices',   siteAccess, ctrl.getMyInvoices);

router.post('/attendance',   siteAccess, ctrl.markAttendance);
router.post('/material-in',  siteAccess, ctrl.materialIn);
router.post('/material-out', siteAccess, ctrl.materialOut);
router.post('/invoice',      siteAccess, upload.single('photo'), ctrl.uploadInvoice);
router.post('/add-material', siteAccess, ctrl.createMaterial);

module.exports = router;
