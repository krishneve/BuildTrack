// models/Invoice.js — Supplier invoice tracking
const mongoose = require('mongoose');

const InvoiceSchema = new mongoose.Schema({
  site:        { type: mongoose.Schema.Types.ObjectId, ref: 'Site', required: true },
  uploadedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  approvedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

  invoiceNumber: { type: String, trim: true },
  supplierName:  { type: String, required: true, trim: true },
  supplierPhone: { type: String, trim: true },

  amount: { type: Number, required: true, min: 0 },
  gst:    { type: Number, default: 0 },
  totalAmount: { type: Number },            // amount + gst, computed on save

  category: {
    type: String,
    enum: ['materials', 'labor', 'equipment', 'overhead', 'other'],
    default: 'materials',
  },

  invoiceDate: { type: Date, default: Date.now },
  dueDate:     { type: Date, default: null },

  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'paid'],
    default: 'pending',
  },

  photoUrl:   { type: String, default: null },  // S3 / Cloudinary URL
  notes:      { type: String, trim: true },
  remarks:    { type: String, trim: true },     // manager's note on approval/rejection

  // Link to budget line item
  budgetCategory: { type: String, default: null },
}, { timestamps: true });

InvoiceSchema.index({ site: 1, status: 1 });
InvoiceSchema.index({ site: 1, createdAt: -1 });

// Auto-compute totalAmount
InvoiceSchema.pre('save', function (next) {
  this.totalAmount = +(this.amount + (this.gst || 0)).toFixed(2);
  next();
});

module.exports = mongoose.model('Invoice', InvoiceSchema);
