const Invoice = require('../models/Invoice');
const Site    = require('../models/Site');
const Budget  = require('../models/Budget');
const { sendSuccess, sendError, sendPaginated } = require('../utils/apiResponse');
const { notifyInvoicePending, notifyInvoiceResult } = require('../utils/notificationHelper');

// POST /invoices/upload
const uploadInvoice = async (req, res) => {
  try {
    const { siteId, supplierName, supplierPhone, amount, gst, invoiceNumber, category, notes, invoiceDate } = req.body;

    const invoice = await Invoice.create({
      site: siteId, uploadedBy: req.user._id,
      supplierName, supplierPhone, amount: Number(amount),
      gst: Number(gst || 0), invoiceNumber, category: category || 'materials',
      notes, invoiceDate: invoiceDate || new Date(),
      // photoUrl would be set after S3 upload (placeholder)
      photoUrl: req.file ? `/uploads/${req.file.filename}` : null,
    });

    // Notify manager
    const site = await Site.findById(siteId).populate('manager', '_id');
    if (site?.manager) {
      await notifyInvoicePending(site.manager._id, siteId, req.user.name, amount);
    }

    return sendSuccess(res, invoice, 'Invoice submitted for approval', 201);
  } catch (err) {
    return sendError(res, err.message || 'Failed to upload invoice', 400);
  }
};

// GET /invoices?siteId=&status=
const getInvoices = async (req, res) => {
  try {
    const { siteId, status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (siteId && siteId !== 'all') query.site = siteId;
    if (status) query.status = status;

    const total = await Invoice.countDocuments(query);
    const invoices = await Invoice.find(query)
      .populate('uploadedBy', 'name')
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    return sendPaginated(res, invoices, total, page, limit);
  } catch (err) {
    return sendError(res, 'Failed to fetch invoices', 500);
  }
};

// GET /invoices/:id
const getInvoiceById = async (req, res) => {
  try {
    const inv = await Invoice.findById(req.params.id)
      .populate('uploadedBy', 'name email')
      .populate('approvedBy', 'name');
    if (!inv) return sendError(res, 'Invoice not found', 404);
    return sendSuccess(res, inv);
  } catch (err) {
    return sendError(res, 'Failed', 500);
  }
};

// PUT /invoices/:id/status
const updateStatus = async (req, res) => {
  try {
    const { status, remarks } = req.body;
    if (!['approved', 'rejected', 'paid'].includes(status)) return sendError(res, 'Invalid status', 400);

    const invoice = await Invoice.findByIdAndUpdate(req.params.id, {
      status, remarks, approvedBy: req.user._id,
    }, { new: true });

    if (!invoice) return sendError(res, 'Invoice not found', 404);

    // Update budget spent amount when approved
    if (status === 'approved') {
      const budget = await Budget.findOne({ site: invoice.site });
      if (budget) {
        budget.totalSpent = +(budget.totalSpent + invoice.totalAmount).toFixed(2);
        // Also update line item
        const lineItem = budget.lineItems.find(l => l.category === (invoice.category || 'materials'));
        if (lineItem) lineItem.spentAmount = +(lineItem.spentAmount + invoice.totalAmount).toFixed(2);
        await budget.save();
      }
    }

    // Notify uploader
    await notifyInvoiceResult(invoice.uploadedBy, invoice.site, status, invoice.invoiceNumber);

    return sendSuccess(res, invoice, `Invoice ${status}`);
  } catch (err) {
    return sendError(res, 'Failed to update status', 500);
  }
};

// GET /invoices/summary?siteId=
const getInvoiceSummary = async (req, res) => {
  try {
    const { siteId } = req.query;
    const query = {};
    if (siteId && siteId !== 'all') query.site = siteId;
    const invoices = await Invoice.find(query).lean();
    const summary = {
      total: invoices.length,
      pending:  invoices.filter(i => i.status === 'pending').length,
      approved: invoices.filter(i => i.status === 'approved').length,
      rejected: invoices.filter(i => i.status === 'rejected').length,
      paid:     invoices.filter(i => i.status === 'paid').length,
      totalAmount:    invoices.reduce((a, i) => a + (i.totalAmount || 0), 0),
      approvedAmount: invoices.filter(i => ['approved','paid'].includes(i.status)).reduce((a, i) => a + (i.totalAmount || 0), 0),
    };
    return sendSuccess(res, summary);
  } catch (err) {
    return sendError(res, 'Failed', 500);
  }
};

module.exports = { uploadInvoice, getInvoices, getInvoiceById, updateStatus, getInvoiceSummary };
