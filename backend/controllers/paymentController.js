const Payment = require('../models/Payment');
const Budget  = require('../models/Budget');
const { sendSuccess, sendError, sendPaginated } = require('../utils/apiResponse');
const { notifyPaymentResult } = require('../utils/notificationHelper');

// GET /payments?siteId=&status=
const getPayments = async (req, res) => {
  try {
    const { siteId, status, page = 1, limit = 20 } = req.query;
    const query = { site: siteId };
    if (status) query.status = status;

    const total = await Payment.countDocuments(query);
    const payments = await Payment.find(query)
      .populate('createdBy', 'name')
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    return sendPaginated(res, payments, total, page, limit);
  } catch (err) {
    return sendError(res, 'Failed to fetch payments', 500);
  }
};

// GET /payments/pending?siteId=
const getPending = async (req, res) => {
  try {
    const { siteId } = req.query;
    const payments = await Payment.find({ site: siteId, status: 'pending' })
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });
    return sendSuccess(res, payments);
  } catch (err) {
    return sendError(res, 'Failed', 500);
  }
};

// POST /payments
const createPayment = async (req, res) => {
  try {
    const { siteId, ...rest } = req.body;
    const payment = await Payment.create({ 
      ...rest, 
      site: siteId || rest.site,
      createdBy: req.user._id 
    });
    return sendSuccess(res, payment, 'Payment created', 201);
  } catch (err) {
    return sendError(res, err.message || 'Failed to create payment', 400);
  }
};

// PUT /payments/:id/approve
const approvePayment = async (req, res) => {
  try {
    const { remarks } = req.body;
    const payment = await Payment.findByIdAndUpdate(req.params.id, {
      status: 'approved', remarks,
      approvedBy: req.user._id, approvedAt: new Date(),
    }, { new: true });
    if (!payment) return sendError(res, 'Payment not found', 404);

    // Update budget labor line item
    const budget = await Budget.findOne({ site: payment.site });
    if (budget) {
      budget.totalSpent = +(budget.totalSpent + payment.amount).toFixed(2);
      const li = budget.lineItems.find(l => l.category === 'labor');
      if (li) li.spentAmount = +(li.spentAmount + payment.amount).toFixed(2);
      await budget.save();
    }

    // Notify payee if user-linked
    if (payment.payeeRef) {
      await notifyPaymentResult(payment.payeeRef, payment.site, 'approved', payment.amount);
    }

    return sendSuccess(res, payment, 'Payment approved');
  } catch (err) {
    return sendError(res, 'Failed', 500);
  }
};

// PUT /payments/:id/reject
const rejectPayment = async (req, res) => {
  try {
    const { reason } = req.body;
    const payment = await Payment.findByIdAndUpdate(req.params.id, {
      status: 'rejected', reason,
      approvedBy: req.user._id,
    }, { new: true });
    if (!payment) return sendError(res, 'Payment not found', 404);
    if (payment.payeeRef) {
      await notifyPaymentResult(payment.payeeRef, payment.site, 'rejected', payment.amount);
    }
    return sendSuccess(res, payment, 'Payment rejected');
  } catch (err) {
    return sendError(res, 'Failed', 500);
  }
};

// GET /payments/summary?siteId=
const getPaymentSummary = async (req, res) => {
  try {
    const { siteId } = req.query;
    const payments = await Payment.find({ site: siteId }).lean();
    const approved = payments.filter(p => ['approved','paid'].includes(p.status));
    return sendSuccess(res, {
      total: payments.length,
      pending:  payments.filter(p => p.status === 'pending').length,
      approved: approved.length,
      totalPaid: approved.reduce((a, p) => a + p.amount, 0),
      byType: ['weekly_labor','monthly_salary','advance','contractor','other'].map(t => ({
        type: t,
        count: approved.filter(p => p.type === t).length,
        amount: approved.filter(p => p.type === t).reduce((a, p) => a + p.amount, 0),
      })),
    });
  } catch (err) {
    return sendError(res, 'Failed', 500);
  }
};

module.exports = { getPayments, getPending, createPayment, approvePayment, rejectPayment, getPaymentSummary };
