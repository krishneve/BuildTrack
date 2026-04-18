// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { ROLES } = require('../config/constants');

const UserSchema = new mongoose.Schema(
  {
    // Identity
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    phone: {
      type: String,
      trim: true,
      match: [/^[6-9]\d{9}$/, 'Please enter a valid Indian mobile number'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Never return password in queries
    },

    // RBAC
    role: {
      type: String,
      enum: Object.values(ROLES),
      required: [true, 'Role is required'],
      default: ROLES.SITE_ENGINEER,
    },

    // Site Assignment (null for Admin — Admin sees all)
    assignedSites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Site',
      },
    ],

    // Primary site (for Manager/Engineer who mainly work at one site)
    primarySite: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Site',
      default: null,
    },

    // Profile
    profilePhoto: {
      type: String,
      default: null,
    },
    designation: {
      type: String,
      trim: true,
      // e.g. "Senior Site Engineer", "Project Manager", "Company Owner"
    },
    employeeId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },

    // FCM Push Token (set from mobile on login/app launch)
    fcmToken: {
      type: String,
      default: null,
      select: false,
    },

    // Account Status
    isActive: {
      type: Boolean,
      default: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    lastLogin: {
      type: Date,
      default: null,
    },

    // Security
    passwordChangedAt: {
      type: Date,
    },
    refreshTokenHash: {
      type: String,
      select: false,
    },

    // Audit
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ───────────────────────────────────────────────
UserSchema.index({ role: 1 });
UserSchema.index({ assignedSites: 1 });
UserSchema.index({ isActive: 1 });

// ─── Pre-save: Hash password ────────────────────────────────
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// ─── Instance Methods ───────────────────────────────────────
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

UserSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// ─── Virtual: Full display name with role ──────────────────
UserSchema.virtual('displayInfo').get(function () {
  return `${this.name} (${this.role})`;
});

const User = mongoose.model('User', UserSchema);
module.exports = User;
