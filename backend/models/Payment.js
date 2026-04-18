// models/Payment.js — Worker & staff payments
const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  site:        { type: mongoose.Schema.Types.ObjectId, ref: 'Site', required: true },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  approvedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

  // Who is being paid
  payeeType: { type: String, enum: ['worker', 'staff', 'contractor', 'vendor'], required: true },
  payeeName: { type: String, required: true, trim: true },
  payeeRef:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

  // Payment details
  type: {
    type: String,
    enum: ['weekly_labor', 'monthly_salary', 'advance', 'bonus', 'contractor', 'material_payment', 'daily_wage', 'other'],
    required: true,
  },
  amount: { type: Number, required: true, min: 0 },
  paymentDate: { type: Date, default: Date.now },
  period: { type: String, trim: true },   // e.g. "Week 1 Apr 2025" or "March 2025"

  method: {
    type: String,
    enum: ['cash', 'bank_transfer', 'upi', 'cheque'],
    default: 'cash',
  },
  utr: { type: String, trim: true },       // UTR / transaction reference

  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'paid'],
    default: 'pending',
  },

  notes:   { type: String, trim: true },
  reason:  { type: String, trim: true },   // rejection reason
  approvedAt: { type: Date, default: null },
}, { timestamps: true });

PaymentSchema.index({ site: 1, status: 1 });
PaymentSchema.index({ site: 1, createdAt: -1 });

module.exports = mongoose.model('Payment', PaymentSchema);
