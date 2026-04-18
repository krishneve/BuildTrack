// server.js — Entry point
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');

const app = express();

// ─── Connect Database ────────────────────────────────────────
connectDB();

// ─── Security Middleware ─────────────────────────────────────
app.use(helmet());

const allowedOrigins = process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',') : ['http://localhost:3000'];
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 1000,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api', limiter);

// Auth endpoint rate limit
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, // increased for testing
  message: { success: false, message: 'Too many login attempts, please try again later.' },
});

// ─── Body Parsing ─────────────────────────────────────────────
app.use('/uploads', express.static(require('path').join(__dirname, 'uploads')));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── API Routes ───────────────────────────────────────────────
app.use('/api/v1/auth', authLimiter, require('./routes/authRoutes'));
app.use('/api/v1/admin', require('./routes/adminRoutes'));
app.use('/api/v1/admin/sites', require('./routes/siteRoutes'));
app.use('/api/v1/admin/users', require('./routes/userRoutes'));
app.use('/api/v1/admin/budgets', require('./routes/budgetRoutes'));

// ─── Health check ─────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'BuildTrack AI API is running', timestamp: new Date() });
});

app.use('/api/v1/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/v1/attendance', require('./routes/attendanceRoutes'));
app.use('/api/v1/inventory', require('./routes/inventoryRoutes'));
app.use('/api/v1/invoices', require('./routes/invoiceRoutes'));
app.use('/api/v1/payments', require('./routes/paymentRoutes'));
app.use('/api/v1/engineer', require('./routes/engineerRoutes'));
app.use('/api/v1/workers', require('./routes/workerRoutes'));
app.use('/api/v1/manager', require('./routes/managerRoutes'));
app.use('/api/v1/ai', require('./routes/aiRoutes'));
app.use('/api/v1/reports', require('./routes/reportRoutes'));
app.use('/api/v1/notifications', require('./routes/notificationRoutes'));

// ─── 404 Handler ──────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ─── Global Error Handler ─────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Global error:', err);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 BuildTrack AI Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
