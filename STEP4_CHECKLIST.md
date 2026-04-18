# Step 4 Completion Checklist — Site Manager (Full Implementation)

## ✅ New Backend

### Worker Model + Controller + Routes
- [x] Worker.js — labourers/contractors separate from User table (trade, wage, employment type, emergency contact)
- [x] workerController.js — getWorkers, getWorkerById, createWorker, updateWorker, deleteWorker (soft), getWorkerStats, createWorkerPayment
- [x] workerRoutes.js — all endpoints protected with Admin|Manager RBAC + siteAccess guard
- [x] Wage calculation helper in createWorkerPayment (per_day × days)

### Manager Controller + Routes
- [x] managerController.js — getDashboard (live data from 10 collections), getSiteSummary (full report data), getWorkerProductivity (daily timeline)
- [x] managerRoutes.js — /manager/dashboard, /manager/reports/site-summary, /manager/reports/worker-productivity

### Seed Data Updated
- [x] 8 workers across 2 sites (masons, carpenters, electricians, plumbers, helpers)

## ✅ Mobile App — Manager (PRIMARY)

### ManagerDashboard (complete rewrite)
- [x] Pull-to-refresh with useFocusEffect (reloads on every tab focus)
- [x] Smart greeting (Good Morning/Afternoon/Evening)
- [x] Pending approvals banner — chips for Attendance / Invoices / Payments tap directly to screen
- [x] 4-tile KPI grid (Present Today, Pending Approval with badge, Low Stock alert, Weekly Spend)
- [x] Budget bar with dynamic color (on_track/at_risk/overrun)
- [x] 3 quick action buttons (Add Worker, Log Material, New Payment)

### WorkersScreen (complete rewrite)
- [x] Full worker list with trade emoji avatars, wage display
- [x] Search by name
- [x] Trade filter chips (scrollable row)
- [x] Worker stats header (total count, estimated weekly bill)
- [x] WorkerCard with Pay / Edit / Remove inline actions
- [x] WorkerFormModal (add/edit) — trade selector, wage type toggle, full validation
- [x] PayWorkerModal — days × rate = total calc, method selector, creates Payment record
- [x] Soft-delete (deactivate) with confirmation

### ApproveAttendanceScreen (complete rewrite)
- [x] Pending / Today tabs
- [x] Large approve (green, 2/3 width) + reject (red, 1/3 width) buttons per card
- [x] One-tap "Approve All" button when multiple pending
- [x] Check-IN / Check-OUT visual distinction with direction arrow
- [x] Worker name, role, time, date, notes display
- [x] Auto-removes card from list on action (optimistic UI)

### PaymentsScreen (complete rewrite)
- [x] Pending / All tabs
- [x] Pending total amount display in subtitle
- [x] PaymentCard with full details (payee, type, period, method, status badge)
- [x] One-tap Approve → updates backend + refreshes
- [x] Reject with confirmation dialog
- [x] Mark as Paid (approved → paid)
- [x] CreatePaymentModal — full form with segmented type/method selectors

### ManagerMaterialsScreen (complete rewrite)
- [x] Stock / Logs tabs
- [x] Low stock alert strip (red banner when items are below threshold)
- [x] Stock card with visual bar showing capacity %
- [x] IN / OUT quick buttons directly on each stock card
- [x] LogModal — large quantity input (48px font), type toggle, supplier field
- [x] Prevents OUT if quantity exceeds current stock
- [x] Transaction log with who/when details

### ReportsScreen (NEW)
- [x] Pull-to-refresh, loads on focus
- [x] Site progress bar
- [x] Budget Overview section (spent/total/% bar)
- [x] Workforce section (total + bar chart by trade)
- [x] Worker Productivity section (7-day attendance timeline)
- [x] Materials section (count/low stock/stock value/low stock list)
- [x] Payments section (total + breakdown by type)
- [x] Invoices section (total/approved/value)

### Navigation
- [x] ManagerNavigator — 5-tab bottom nav (Dashboard | Workers | Materials | Payments | Reports)
- [x] Stack screens: ApproveAttendance, LogMaterial, CreatePayment, AddWorker
- [x] Badge dots on tabs (future: connect to live count)

### New Mobile Services
- [x] workerService.js — getAll, getById, getStats, create, update, remove, createPayment
- [x] managerService.js — getDashboard, getSiteSummary, getProductivity

## 🔜 Step 5 Options
- [ ] Push notifications (FCM) — real-time approval alerts
- [ ] Invoice photo upload to cloud storage
- [ ] Engineer mobile — full screen rewrite (attendance + material log parity with manager)
- [ ] Web: Site Manager web dashboard view
- [ ] Reports PDF export
- [ ] Daily site diary (notes + photos per day)
