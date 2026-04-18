// utils/seed.js
// Run: node utils/seed.js
// Seeds initial Admin user and sample data for Samarth Developers

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function seed() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('❌ MONGO_URI not found in environment variables!');
    process.exit(1);
  }
  
  console.log('Connecting to:', uri.split('@')[1] || 'Local DB'); // Log host safely
  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  // Lazy-load models (after connection)
  const User = require('../models/User');
  const Site = require('../models/Site');
  const Budget = require('../models/Budget');

  // ─── Clear existing data ───────────────────────────────────
  await Promise.all([User.deleteMany(), Site.deleteMany(), Budget.deleteMany()]);
  console.log('Cleared existing data');

  // ─── Create Admin ──────────────────────────────────────────
  const admin = await User.create({
    name: 'Suresh Samarth',
    email: 'admin@samarthdevelopers.com',
    phone: '9876543210',
    password: 'Admin@12345',
    role: 'admin',
    designation: 'Company Owner',
    employeeId: 'SD-ADMIN-001',
    isEmailVerified: true,
  });
  console.log('Created Admin:', admin.email);

  // ─── Create Site Managers ──────────────────────────────────
  const [mgr1, mgr2] = await User.create([
    { name: 'Rakesh Patil', email: 'rakesh@samarthdevelopers.com', phone: '9823456789', password: 'Manager@123', role: 'site_manager', designation: 'Senior Project Manager', employeeId: 'SD-MGR-001', createdBy: admin._id },
    { name: 'Priya Kulkarni', email: 'priya@samarthdevelopers.com', phone: '9845678901', password: 'Manager@123', role: 'site_manager', designation: 'Project Manager', employeeId: 'SD-MGR-002', createdBy: admin._id },
  ]);
  console.log('Created Managers');

  // ─── Create Engineers ──────────────────────────────────────
  const [eng1, eng2, eng3] = await User.create([
    { name: 'Amit Deshmukh', email: 'amit@samarthdevelopers.com', phone: '9811223344', password: 'Engineer@123', role: 'site_engineer', designation: 'Senior Site Engineer', employeeId: 'SD-ENG-001', createdBy: admin._id },
    { name: 'Sneha More', email: 'sneha@samarthdevelopers.com', phone: '9833445566', password: 'Engineer@123', role: 'site_engineer', designation: 'Civil Engineer', employeeId: 'SD-ENG-002', createdBy: admin._id },
    { name: 'Vijay Shinde', email: 'vijay@samarthdevelopers.com', phone: '9855667788', password: 'Engineer@123', role: 'site_engineer', designation: 'Structural Engineer', employeeId: 'SD-ENG-003', createdBy: admin._id },
  ]);
  console.log('Created Engineers');

  // ─── Create Sites ──────────────────────────────────────────
  const site1 = await Site.create({
    name: 'Samarth Residency Phase 1',
    projectType: 'residential',
    description: '120-unit residential apartment complex near Gangapur Road',
    location: { address: 'Plot 45, Near Gangapur Road', city: 'Nashik', state: 'Maharashtra', pincode: '422013' },
    status: 'active',
    startDate: new Date('2024-01-15'),
    expectedEndDate: new Date('2025-12-31'),
    manager: mgr1._id,
    engineers: [eng1._id, eng2._id],
    metrics: { totalWorkers: 85, totalSpent: 4200000, progressPercent: 42 },
    createdBy: admin._id,
  });

  const site2 = await Site.create({
    name: 'Samarth Commercial Hub',
    projectType: 'commercial',
    description: 'G+5 commercial complex in Nashik Road area',
    location: { address: 'Survey No. 112, Nashik Road', city: 'Nashik', state: 'Maharashtra', pincode: '422101' },
    status: 'active',
    startDate: new Date('2024-03-01'),
    expectedEndDate: new Date('2026-02-28'),
    manager: mgr2._id,
    engineers: [eng3._id],
    metrics: { totalWorkers: 52, totalSpent: 2800000, progressPercent: 28 },
    createdBy: admin._id,
  });

  const site3 = await Site.create({
    name: 'Samarth Villa Township',
    projectType: 'residential',
    description: '45-unit villa project in Satpur area',
    location: { address: 'Satpur MIDC Road, Near Ambad', city: 'Nashik', state: 'Maharashtra', pincode: '422007' },
    status: 'planning',
    startDate: new Date('2025-06-01'),
    expectedEndDate: new Date('2027-05-31'),
    metrics: { totalWorkers: 0, totalSpent: 0, progressPercent: 0 },
    createdBy: admin._id,
  });
  console.log('Created Sites');

  // Assign sites to users
  await User.findByIdAndUpdate(mgr1._id, { $addToSet: { assignedSites: site1._id }, primarySite: site1._id });
  await User.findByIdAndUpdate(mgr2._id, { $addToSet: { assignedSites: site2._id }, primarySite: site2._id });
  await User.findByIdAndUpdate(eng1._id, { $addToSet: { assignedSites: site1._id } });
  await User.findByIdAndUpdate(eng2._id, { $addToSet: { assignedSites: site1._id } });
  await User.findByIdAndUpdate(eng3._id, { $addToSet: { assignedSites: site2._id } });

  // ─── Create Budgets ────────────────────────────────────────
  await Budget.create({
    site: site1._id,
    totalBudget: 12000000,
    totalSpent: 4200000,
    financialYear: '2024-25',
    lineItems: [
      { category: 'materials', allocatedAmount: 6000000, spentAmount: 2100000 },
      { category: 'labor', allocatedAmount: 3000000, spentAmount: 1400000 },
      { category: 'equipment', allocatedAmount: 1500000, spentAmount: 500000 },
      { category: 'overhead', allocatedAmount: 900000, spentAmount: 150000 },
      { category: 'contingency', allocatedAmount: 600000, spentAmount: 50000 },
    ],
    createdBy: admin._id,
  });

  await Budget.create({
    site: site2._id,
    totalBudget: 8500000,
    totalSpent: 2800000,
    financialYear: '2024-25',
    lineItems: [
      { category: 'materials', allocatedAmount: 4000000, spentAmount: 1500000 },
      { category: 'labor', allocatedAmount: 2500000, spentAmount: 900000 },
      { category: 'equipment', allocatedAmount: 1000000, spentAmount: 300000 },
      { category: 'overhead', allocatedAmount: 700000, spentAmount: 80000 },
      { category: 'contingency', allocatedAmount: 300000, spentAmount: 20000 },
    ],
    createdBy: admin._id,
  });
  console.log('Created Budgets');


// ─── Seed Step 3 data (Materials, Inventory, Payments, Invoices) ───────────
const Material     = require('../models/Material');
const InventoryLog = require('../models/InventoryLog');
const Payment      = require('../models/Payment');
const Invoice      = require('../models/Invoice');
const Attendance   = require('../models/Attendance');
const Notification = require('../models/Notification');

await Promise.all([
  Material.deleteMany(), InventoryLog.deleteMany(),
  Payment.deleteMany(), Invoice.deleteMany(),
  Attendance.deleteMany(), Notification.deleteMany(),
]);

// ─── Materials for Site 1 ─────────────────────────────────────────────────
const materials1 = await Material.create([
  { site: site1._id, name: 'OPC Cement 53 Grade', category: 'cement', unit: 'bags', emoji: '🏗', currentStock: 120, minThreshold: 50, maxCapacity: 500, unitCost: 380, createdBy: admin._id },
  { site: site1._id, name: 'TMT Steel Fe500', category: 'steel', unit: 'kg', emoji: '⚙', currentStock: 2400, minThreshold: 1000, maxCapacity: 10000, unitCost: 68, createdBy: admin._id },
  { site: site1._id, name: 'Red Clay Bricks', category: 'bricks', unit: 'nos', emoji: '🧱', currentStock: 8500, minThreshold: 2000, maxCapacity: 50000, unitCost: 8, createdBy: admin._id },
  { site: site1._id, name: 'River Sand', category: 'sand', unit: 'tonnes', emoji: '🟨', currentStock: 28, minThreshold: 40, maxCapacity: 100, unitCost: 1200, createdBy: admin._id },
  { site: site1._id, name: '20mm Aggregate', category: 'aggregate', unit: 'tonnes', emoji: '⬤', currentStock: 18, minThreshold: 10, maxCapacity: 80, unitCost: 950, createdBy: admin._id },
  { site: site1._id, name: 'Safety Helmets', category: 'safety', unit: 'nos', emoji: '⛑', currentStock: 35, minThreshold: 20, maxCapacity: 100, unitCost: 450, createdBy: admin._id },
]);

// ─── Inventory logs ───────────────────────────────────────────────────────
await InventoryLog.create([
  { site: site1._id, material: materials1[0]._id, loggedBy: eng1._id, type: 'in', quantity: 50, balanceAfter: 120, supplier: 'Ambuja Cements Nashik', totalCost: 19000 },
  { site: site1._id, material: materials1[0]._id, loggedBy: eng1._id, type: 'out', quantity: 20, balanceAfter: 100, purpose: '3rd floor slab', totalCost: 7600 },
  { site: site1._id, material: materials1[1]._id, loggedBy: eng2._id, type: 'in', quantity: 1000, balanceAfter: 2400, supplier: 'Sail Steel Nashik', totalCost: 68000 },
  { site: site1._id, material: materials1[3]._id, loggedBy: eng1._id, type: 'out', quantity: 5, balanceAfter: 28, purpose: 'Plastering work', totalCost: 6000 },
]);

// ─── Invoices ─────────────────────────────────────────────────────────────
await Invoice.create([
  { site: site1._id, uploadedBy: eng1._id, supplierName: 'Ambuja Cements', invoiceNumber: 'AMB-2025-0112', amount: 95000, gst: 17100, category: 'materials', status: 'approved', approvedBy: mgr1._id, notes: 'Cement delivery - 250 bags' },
  { site: site1._id, uploadedBy: eng2._id, supplierName: 'Nashik Steel Traders', invoiceNumber: 'NST-2025-0089', amount: 136000, gst: 24480, category: 'materials', status: 'pending', notes: 'TMT Fe500 - 2 tonnes' },
  { site: site2._id, uploadedBy: eng3._id, supplierName: 'Ganesh Bricks', invoiceNumber: 'GB-2025-0045', amount: 68000, gst: 0, category: 'materials', status: 'pending', notes: 'Red bricks - 8500 nos' },
]);

// ─── Payments ─────────────────────────────────────────────────────────────
await Payment.create([
  { site: site1._id, createdBy: mgr1._id, payeeType: 'worker', payeeName: 'Suresh Laborer Group (12 workers)', type: 'weekly_labor', amount: 24000, period: 'Week 1 Apr 2025', method: 'cash', status: 'approved', approvedBy: mgr1._id },
  { site: site1._id, createdBy: mgr1._id, payeeType: 'worker', payeeName: 'Daily Mason Group (8 workers)', type: 'weekly_labor', amount: 18400, period: 'Week 1 Apr 2025', method: 'cash', status: 'pending', notes: 'Including overtime' },
  { site: site1._id, createdBy: mgr1._id, payeeType: 'contractor', payeeName: 'Nashik Electrical Works', type: 'contractor', amount: 45000, period: 'Phase 1 Electrical', method: 'bank_transfer', status: 'pending' },
  { site: site2._id, createdBy: mgr2._id, payeeType: 'worker', payeeName: 'Foundation Workers (6 workers)', type: 'weekly_labor', amount: 12000, period: 'Week 1 Apr 2025', method: 'cash', status: 'approved', approvedBy: mgr2._id },
]);

// ─── Notifications ────────────────────────────────────────────────────────
await Notification.create([
  { recipient: mgr1._id, site: site1._id, type: 'invoice_pending', title: 'New Invoice Uploaded', message: 'Amit Deshmukh uploaded an invoice of ₹1,60,480 from Nashik Steel Traders.', isRead: false },
  { recipient: admin._id, site: site1._id, type: 'low_stock', title: '⚠ Low Stock Alert', message: 'River Sand is running low: 28 tonnes remaining (min: 40).', isRead: false },
  { recipient: mgr1._id, site: site1._id, type: 'attendance_pending', title: 'Attendance Awaiting Approval', message: 'Amit Deshmukh has marked attendance. Please review.', isRead: true },
]);

console.log('✅ Step 3 seed data added');
console.log('  - 6 Materials (Site 1)');
console.log('  - 4 Inventory logs');
console.log('  - 3 Invoices (1 approved, 2 pending)');
console.log('  - 4 Payments (2 approved, 2 pending)');
console.log('  - 3 Notifications');

  console.log('\n=== SEED COMPLETE ===')
  console.log('Admin Login:');
  console.log('  Email:    admin@samarthdevelopers.com');
  console.log('  Password: Admin@12345');
  console.log('\nManager Login:');
  console.log('  Email:    rakesh@samarthdevelopers.com');
  console.log('  Password: Manager@123');

  await mongoose.connection.close();
}

seed().catch(console.error);
