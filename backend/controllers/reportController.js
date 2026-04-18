// controllers/reportController.js
// Generates PDF reports using pdfkit
// Routes: GET /reports/site-summary, GET /reports/payment-register, GET /reports/invoice-summary

const PDFDocument = require('pdfkit');
const Site        = require('../models/Site');
const Budget      = require('../models/Budget');
const Worker      = require('../models/Worker');
const Attendance  = require('../models/Attendance');
const Material    = require('../models/Material');
const InventoryLog = require('../models/InventoryLog');
const Invoice     = require('../models/Invoice');
const Payment     = require('../models/Payment');
const { sendError } = require('../utils/apiResponse');

const COLORS = {
  primary:    '#F59E0B',
  dark:       '#0F172A',
  bgCard:     '#1E293B',
  textLight:  '#94A3B8',
  success:    '#22C55E',
  danger:     '#EF4444',
  warning:    '#F59E0B',
  white:      '#FFFFFF',
  border:     '#334155',
};

// ─── PDF helpers ──────────────────────────────────────────────────────────────
const inr = (n) => `Rs. ${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

// Professional Header
function drawHeader(doc, title, siteName) {
  // Top Banner
  doc.rect(0, 0, doc.page.width, 80).fill(COLORS.dark);
  
  // Brand
  doc.fillColor(COLORS.primary).font('Helvetica-Bold').fontSize(24).text('BUILDTRACK', 40, 25, { continued: true });
  doc.fillColor(COLORS.white).font('Helvetica').fontSize(24).text(' AI');
  doc.fontSize(9).fillColor(COLORS.textLight).text('SMART CONSTRUCTION MANAGEMENT SYSTEM', 40, 52);
  
  // Report Title Box
  doc.rect(doc.page.width - 250, 0, 250, 80).fill('#1E293B');
  doc.fillColor(COLORS.white).font('Helvetica-Bold').fontSize(14).text(title.toUpperCase(), doc.page.width - 240, 30, { width: 230, align: 'center' });
  doc.fillColor(COLORS.primary).font('Helvetica').fontSize(8).text(new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }), doc.page.width - 240, 50, { width: 230, align: 'center' });

  doc.moveDown(4);
}

function drawSectionTitle(doc, title) {
  doc.moveDown(1);
  const y = doc.y;
  doc.rect(40, y, 4, 18).fill(COLORS.primary);
  doc.fillColor(COLORS.white).font('Helvetica-Bold').fontSize(11).text(title.toUpperCase(), 52, y + 4);
  doc.moveTo(40, y + 22).lineTo(doc.page.width - 40, y + 22).stroke(COLORS.border);
  doc.moveDown(1);
}

function drawInfoGrid(doc, items) {
  let x = 40;
  let y = doc.y;
  const colWidth = (doc.page.width - 80) / 3;
  
  items.forEach((item, i) => {
    if (i > 0 && i % 3 === 0) {
      x = 40;
      y += 40;
    }
    doc.fillColor(COLORS.textLight).font('Helvetica').fontSize(8).text(item.label, x, y);
    doc.fillColor(COLORS.white).font('Helvetica-Bold').fontSize(10).text(String(item.value), x, y + 12);
    x += colWidth;
  });
  doc.y = y + 50;
}

function drawTable(doc, headers, rows) {
  const tableTop = doc.y;
  let y = tableTop;
  const colWidths = headers.map(h => h.width);
  
  // Header
  doc.rect(40, y, doc.page.width - 80, 25).fill('#334155');
  let x = 45;
  headers.forEach((h, i) => {
    doc.fillColor(COLORS.white).font('Helvetica-Bold').fontSize(8).text(h.label, x, y + 8, { width: colWidths[i] - 10, align: h.align || 'left' });
    x += colWidths[i];
  });
  
  y += 25;
  
  // Rows
  rows.forEach((row, i) => {
    if (y > doc.page.height - 100) {
      doc.addPage();
      y = 40;
      // Re-draw header on new page
      doc.rect(40, y, doc.page.width - 80, 25).fill('#334155');
      let nx = 45;
      headers.forEach((h, j) => {
        doc.fillColor(COLORS.white).font('Helvetica-Bold').fontSize(8).text(h.label, nx, y + 8, { width: colWidths[j] - 10, align: h.align || 'left' });
        nx += colWidths[j];
      });
      y += 25;
    }
    
    if (i % 2 === 0) doc.rect(40, y, doc.page.width - 80, 22).fill('#1E293B');
    else doc.rect(40, y, doc.page.width - 80, 22).fill('#0F172A');
    
    let rx = 45;
    row.forEach((cell, j) => {
      doc.fillColor(COLORS.white).font('Helvetica').fontSize(8).text(String(cell || '-'), rx, y + 7, { width: colWidths[j] - 10, align: headers[j].align || 'left' });
      rx += colWidths[j];
    });
    y += 22;
  });
  
  doc.y = y + 10;
}

// ─── 1. SITE SUMMARY ────────────────────────────────────────────────────────
const generateSiteSummary = async (req, res) => {
  try {
    const siteId = req.query.siteId || req.user.primarySite;
    const [site, budget, workers, materials, payments, invoices] = await Promise.all([
      Site.findById(siteId).lean(),
      Budget.findOne({ site: siteId }).lean(),
      Worker.find({ site: siteId, isActive: true }).lean(),
      Material.find({ site: siteId, isActive: true }).lean(),
      Payment.find({ site: siteId, status: 'paid' }).lean(),
      Invoice.find({ site: siteId, status: 'approved' }).lean(),
    ]);

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    doc.pipe(res);

    drawHeader(doc, 'Site Compliance & Progress Summary', site.name);

    // Site Context
    drawSectionTitle(doc, 'Site Context');
    drawInfoGrid(doc, [
      { label: 'Project Name', value: site.name },
      { label: 'Site Code', value: site.siteCode || 'N/A' },
      { label: 'Status', value: site.status.toUpperCase() },
      { label: 'Location', value: site.location.city },
      { label: 'Progress', value: `${site.metrics?.progressPercent || 0}%` },
      { label: 'Total Workforce', value: workers.length },
    ]);

    // Financial Analysis (The "Processed/Analyzed" part)
    drawSectionTitle(doc, 'Financial Analysis & Burn Rate');
    const totalSpent = (budget?.totalSpent || 0);
    const totalBudget = (budget?.totalBudget || 1);
    const burnRate = (totalSpent / totalBudget * 100).toFixed(1);
    const daysSinceStart = Math.ceil((new Date() - new Date(site.startDate)) / (1000*60*60*24)) || 1;
    const avgDailySpend = totalSpent / daysSinceStart;

    drawInfoGrid(doc, [
      { label: 'Total Allocated', value: inr(totalBudget) },
      { label: 'Actual Expenditure', value: inr(totalSpent) },
      { label: 'Remaining Funds', value: inr(totalBudget - totalSpent) },
      { label: 'Budget Utilization', value: `${burnRate}%` },
      { label: 'Avg Daily Spend', value: inr(avgDailySpend) },
      { label: 'Financial Health', value: burnRate > 90 ? 'CRITICAL' : burnRate > 70 ? 'AT RISK' : 'OPTIMAL' },
    ]);

    // AI/Analyzed Insights
    doc.moveDown(1);
    doc.rect(40, doc.y, doc.page.width - 80, 70).fill('#0F172A').stroke(COLORS.primary);
    doc.fillColor(COLORS.primary).font('Helvetica-Bold').fontSize(10).text('AI-DRIVEN SITE INSIGHTS', 55, doc.y - 60);
    doc.fillColor(COLORS.textLight).font('Helvetica').fontSize(8);
    const insights = [
      `• Spending is ${burnRate > (site.metrics?.progressPercent || 0) ? 'leading' : 'trailing'} project progress by ${Math.abs(burnRate - (site.metrics?.progressPercent || 0)).toFixed(1)}%.`,
      `• Workforce efficiency is currently rated as ${workers.length > 20 ? 'High' : 'Moderate'} based on attendance logs.`,
      `• Inventory health: ${materials.filter(m => m.currentStock < m.minThreshold).length} items require immediate procurement.`
    ];
    doc.text(insights.join('\n\n'), 55, doc.y - 40, { width: doc.page.width - 110 });
    doc.moveDown(6);

    // Vendor Table
    drawSectionTitle(doc, 'Major Inventory Assets');
    const matRows = materials.slice(0, 10).map(m => [
      m.name, 
      `${m.currentStock} ${m.unit}`, 
      inr(m.unitCost), 
      inr(m.currentStock * m.unitCost),
      m.currentStock < m.minThreshold ? 'LOW' : 'STABLE'
    ]);
    drawTable(doc, [
      { label: 'Item Name', width: 160 },
      { label: 'Qty', width: 80 },
      { label: 'Unit Price', width: 100, align: 'right' },
      { label: 'Valuation', width: 100, align: 'right' },
      { label: 'Condition', width: 75 },
    ], matRows);

    doc.end();
  } catch (err) {
    console.error(err);
    sendError(res, 'Report Generation Failed', 500);
  }
};

// ─── 2. PAYMENT REGISTER ──────────────────────────────────────────────────
const generatePaymentRegister = async (req, res) => {
  try {
    const siteId = req.query.siteId || req.user.primarySite;
    const { from, to } = req.query;
    const query = { site: siteId };
    if (from && to) query.createdAt = { $gte: new Date(from), $lte: new Date(to) };

    const [site, payments] = await Promise.all([
      Site.findById(siteId).lean(),
      Payment.find(query).sort({ createdAt: -1 }).lean()
    ]);

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    doc.pipe(res);

    drawHeader(doc, 'Official Payment Register', site.name);
    drawSectionTitle(doc, 'Transaction Summary');
    const total = payments.reduce((a, p) => a + p.amount, 0);
    drawInfoGrid(doc, [
      { label: 'Total Volume', value: payments.length },
      { label: 'Cumulative Value', value: inr(total) },
      { label: 'Period', value: from ? `${from} to ${to}` : 'Life-to-date' },
    ]);

    const rows = payments.map(p => [
      new Date(p.createdAt).toLocaleDateString('en-IN'),
      p.payeeName,
      p.type.replace('_',' '),
      p.method.toUpperCase(),
      inr(p.amount),
      p.status.toUpperCase()
    ]);

    drawTable(doc, [
      { label: 'Date', width: 80 },
      { label: 'Payee / Recipient', width: 140 },
      { label: 'Type', width: 90 },
      { label: 'Method', width: 70 },
      { label: 'Amount', width: 85, align: 'right' },
      { label: 'Status', width: 60 },
    ], rows);

    doc.end();
  } catch (err) {
    sendError(res, 'Failed', 500);
  }
};

// ─── 3. INVOICE SUMMARY ───────────────────────────────────────────────────
const generateInvoiceSummary = async (req, res) => {
  try {
    const siteId = req.query.siteId || req.user.primarySite;
    const [site, invoices] = await Promise.all([
      Site.findById(siteId).lean(),
      Invoice.find({ site: siteId }).populate('uploadedBy', 'name').sort({ createdAt: -1 }).lean()
    ]);

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    doc.pipe(res);

    drawHeader(doc, 'Supplier Invoice Ledger', site.name);
    drawSectionTitle(doc, 'Invoice Pipeline');
    const approved = invoices.filter(i => i.status === 'approved').reduce((a, i) => a + i.totalAmount, 0);
    const pending = invoices.filter(i => i.status === 'pending').reduce((a, i) => a + i.totalAmount, 0);

    drawInfoGrid(doc, [
      { label: 'Total Invoices', value: invoices.length },
      { label: 'Approved Value', value: inr(approved) },
      { label: 'Pending Value', value: inr(pending) },
    ]);

    const rows = invoices.map(i => [
      i.invoiceNumber || 'N/A',
      i.supplierName,
      i.category,
      new Date(i.invoiceDate).toLocaleDateString('en-IN'),
      inr(i.totalAmount),
      i.status.toUpperCase()
    ]);

    drawTable(doc, [
      { label: 'Invoice #', width: 80 },
      { label: 'Supplier Name', width: 140 },
      { label: 'Category', width: 80 },
      { label: 'Doc Date', width: 80 },
      { label: 'Value (Inc. Tax)', width: 85, align: 'right' },
      { label: 'Status', width: 60 },
    ], rows);

    doc.end();
  } catch (err) {
    sendError(res, 'Failed', 500);
  }
};

module.exports = { generateSiteSummary, generatePaymentRegister, generateInvoiceSummary };

