// models/Budget.js
const mongoose = require('mongoose');
const { BUDGET_STATUS } = require('../config/constants');

// Budget line items — category breakdown
const BudgetLineItemSchema = new mongoose.Schema({
  category: {
    type: String,
    enum: ['materials', 'labor', 'equipment', 'overhead', 'contingency', 'other'],
    required: true,
  },
  allocatedAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  spentAmount: {
    type: Number,
    default: 0,
    min: 0,
  },
  notes: { type: String, trim: true },
}, { _id: true, timestamps: false });

// Budget revision history (audit trail)
const RevisionSchema = new mongoose.Schema({
  revisedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  previousTotal: { type: Number, required: true },
  newTotal: { type: Number, required: true },
  reason: { type: String, required: true, trim: true },
  revisedAt: { type: Date, default: Date.now },
}, { _id: true });

const BudgetSchema = new mongoose.Schema(
  {
    site: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Site',
      required: true,
      unique: true,  // One budget document per site
    },

    // Total sanctioned budget
    totalBudget: {
      type: Number,
      required: [true, 'Total budget is required'],
      min: [1, 'Budget must be positive'],
    },

    // Category breakdown
    lineItems: [BudgetLineItemSchema],

    // Computed fields (updated on every spend event)
    totalSpent: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Status auto-computed from % spent
    status: {
      type: String,
      enum: Object.values(BUDGET_STATUS),
      default: BUDGET_STATUS.ON_TRACK,
    },

    // Financial year
    financialYear: {
      type: String,
      // e.g. "2024-25"
      match: [/^\d{4}-\d{2}$/, 'Format: YYYY-YY'],
    },

    // Revision history — for full audit trail
    revisions: [RevisionSchema],

    // Created by Admin
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ────────────────────────────────────────────────
BudgetSchema.index({ site: 1 });
BudgetSchema.index({ status: 1 });

// ─── Virtual: Remaining budget ──────────────────────────────
BudgetSchema.virtual('remaining').get(function () {
  return this.totalBudget - this.totalSpent;
});

// ─── Virtual: % consumed ────────────────────────────────────
BudgetSchema.virtual('percentConsumed').get(function () {
  if (!this.totalBudget) return 0;
  return parseFloat(((this.totalSpent / this.totalBudget) * 100).toFixed(2));
});

// ─── Pre-save: Auto-update status ───────────────────────────
BudgetSchema.pre('save', function (next) {
  const pct = (this.totalSpent / this.totalBudget) * 100;
  if (pct >= 100) {
    this.status = BUDGET_STATUS.OVERRUN;
  } else if (pct >= 80) {
    this.status = BUDGET_STATUS.AT_RISK;
  } else {
    this.status = BUDGET_STATUS.ON_TRACK;
  }
  next();
});

const Budget = mongoose.model('Budget', BudgetSchema);
module.exports = Budget;
