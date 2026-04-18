const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { siteAccess } = require('../middleware/rbac');
const ctrl = require('../controllers/invoiceController');
const upload = require('../middleware/upload');

router.use(protect);

router.post('/upload', siteAccess, upload.single('photo'), ctrl.uploadInvoice);
router.get('/',            siteAccess, ctrl.getInvoices);
router.get('/summary',     siteAccess, ctrl.getInvoiceSummary);
router.get('/:id',                     ctrl.getInvoiceById);
router.put('/:id/status',              ctrl.updateStatus);
router.patch('/:id/status',            ctrl.updateStatus);

module.exports = router;
