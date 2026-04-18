// models/Site.js
const mongoose = require('mongoose');
const { SITE_STATUS } = require('../config/constants');

const LocationSchema = new mongoose.Schema({
  address: { type: String, required: true },
  city: { type: String, required: true, default: 'Nashik' },
  state: { type: String, required: true, default: 'Maharashtra' },
  pincode: { type: String, match: [/^\d{6}$/, 'Invalid pincode'] },
  googleMapsUrl: { type: String, trim: true },
  coordinates: {
    lat: { type: Number },
    lng: { type: Number },
  },
}, { _id: false });

const SiteSchema = new mongoose.Schema(
  {
    // Identity
    name: {
      type: String,
      required: [true, 'Site name is required'],
      trim: true,
      unique: true,
      maxlength: [150, 'Site name cannot exceed 150 characters'],
    },
    siteCode: {
      type: String,
      unique: true,
      uppercase: true,
      trim: true,
      // e.g. "SD-NSK-001" (Samarth Developers - Nashik - 001)
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500],
    },

    // Type
    projectType: {
      type: String,
      enum: ['residential', 'commercial', 'infrastructure', 'industrial', 'mixed_use'],
      required: true,
    },

    // Location
    location: {
      type: LocationSchema,
      required: true,
    },

    // Status
    status: {
      type: String,
      enum: Object.values(SITE_STATUS),
      default: SITE_STATUS.PLANNING,
    },

    // Timeline
    startDate: {
      type: Date,
      required: true,
    },
    expectedEndDate: {
      type: Date,
      required: true,
    },
    actualEndDate: {
      type: Date,
      default: null,
    },

    // Personnel
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    engineers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],

    // Metrics (denormalized for quick dashboard reads)
    metrics: {
      totalWorkers: { type: Number, default: 0 },
      totalSpent: { type: Number, default: 0 },    // in INR
      progressPercent: { type: Number, default: 0, min: 0, max: 100 },
    },

    // Soft delete
    isActive: {
      type: Boolean,
      default: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },

    // Architects & Drawings
    architects: [
      {
        name: { type: String, required: true },
        drawings: [
          {
            name: { type: String, required: true },
            type: { type: String }, // e.g. "Structural", "Electrical"
            status: { type: String, enum: ['pending', 'submitted'], default: 'pending' },
            submissionDate: { type: Date },
            fileUrl: { type: String },
          }
        ],
        payment: {
          totalAmount: { type: Number, default: 0 },
          paidAmount: { type: Number, default: 0 },
          pendingAmount: { type: Number, default: 0 },
          status: { type: String, enum: ['paid', 'partial', 'pending'], default: 'pending' },
        }
      }
    ],

    // Audit
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
SiteSchema.index({ status: 1 });
SiteSchema.index({ manager: 1 });
SiteSchema.index({ isActive: 1 });
SiteSchema.index({ siteCode: 1 });

// ─── Pre-save: Auto-generate siteCode ──────────────────────
SiteSchema.pre('save', async function (next) {
  if (!this.siteCode) {
    const count = await mongoose.model('Site').countDocuments();
    this.siteCode = `SD-NSK-${String(count + 1).padStart(3, '0')}`;
  }
  next();
});

// ─── Virtual: Is overdue ─────────────────────────────────────
SiteSchema.virtual('isOverdue').get(function () {
  if (this.status === 'completed' || this.status === 'cancelled') return false;
  return new Date() > this.expectedEndDate;
});

// ─── Virtual: Duration in days ──────────────────────────────
SiteSchema.virtual('durationDays').get(function () {
  const end = this.actualEndDate || new Date();
  return Math.ceil((end - this.startDate) / (1000 * 60 * 60 * 24));
});

const Site = mongoose.model('Site', SiteSchema);
module.exports = Site;
