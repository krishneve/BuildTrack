# Step 6 Completion Checklist — Site Engineer Role (Full)

## ✅ Backend — Engineer Module

### engineerController.js (7 endpoints, all optimised)
- [x] GET /engineer/home — single endpoint loads everything the Dashboard needs
  - Site info, today's check-in/out status, material logs count, invoice count, low stock summary, recent logs, unread notifications count
- [x] GET /engineer/stock — full stock with isLowStock, stockValue, fillPercent virtual fields
- [x] GET /engineer/my-logs — engineer's own material logs (default 7 days)
- [x] GET /engineer/my-invoices — engineer's own invoice uploads
- [x] POST /engineer/attendance — check-in OR check-out with:
  - Duplicate-today check
  - "Must check-in before check-out" validation
  - Manager push notification trigger
  - offlineId support for sync
- [x] POST /engineer/material-in — receive material, updates stock, creates log
- [x] POST /engineer/material-out — consume material, prevents overdraw, triggers low-stock alert + push
- [x] POST /engineer/invoice — submit invoice with optional photo upload (Multer)

### engineerRoutes.js
- [x] All routes: protect + restrictTo(Admin|Manager|Engineer)
- [x] All routes: siteAccess guard
- [x] Multer config: /uploads/invoices, 8MB limit, jpg/png/pdf only
- [x] Static file serving: /uploads → served via express.static

### engineerService.js (mobile)
- [x] getHome, getStock, getMyLogs, getMyInvoices
- [x] markAttendance, materialIn, materialOut
- [x] uploadInvoice (multipart) + submitInvoice (JSON fallback)

## ✅ Mobile Screens (5 screens, all rewritten)

### EngineerDashboard.js
- [x] Single API call (getHome) for all data
- [x] useFocusEffect reload on every tab focus
- [x] Live clock greeting (Morning/Afternoon/Evening)
- [x] Notification bell with unread badge
- [x] Attendance banner: Not Checked In (red) / Checked In (yellow) / Done (blue) — taps to Attendance tab
- [x] 3-stat tiles (Logs Today / Invoices Today / Low Stock)
- [x] Low stock warning banner with item names — taps to Materials
- [x] 2×2 action grid: Check Attendance, Material IN, Material OUT, Upload Invoice
- [x] Today's activity log feed (last 5 entries)
- [x] Pull-to-refresh

### AttendanceScreen.js
- [x] Live ticking clock (seconds update)
- [x] Today status chips (Check IN / Check OUT with approval state)
- [x] Optional notes text field (toggle show/hide)
- [x] CHECK IN (green, large) + CHECK OUT (red, large) buttons
- [x] Correct disable logic (can't OUT without IN, can't double-mark)
- [x] Offline queue support with immediate UI update
- [x] 14-record history list with IN/OUT arrow icons + status badges

### MaterialLogScreen.js (new unified IN/OUT screen)
- [x] Type toggle (IN green / OUT red) with description text
- [x] Material picker with live search + horizontal scroll chips
- [x] Per-chip stock level display + LOW STOCK warning
- [x] Selected material card with ✕ clear button
- [x] Giant 56pt quantity input (field-worker optimised)
- [x] Supplier field (for IN) / Purpose field (for OUT)
- [x] Optional notes
- [x] Stock overdraw prevention before submit
- [x] Offline queue support
- [x] Route param: defaultType ('in'|'out') for deep linking

### MaterialsScreen.js
- [x] useFocusEffect reload
- [x] Search bar + category filter chips (scrollable)
- [x] Per-item fill bar (currentStock/maxCapacity %)
- [x] LOW STOCK indicator per card
- [x] Direct ⬇ IN / ⬆ OUT quick buttons on every card → deep link to MaterialLog

### InvoiceUploadScreen.js (new dedicated upload screen)
- [x] Camera + Gallery photo capture
- [x] Photo preview with remove button
- [x] Supplier name, amount, GST inputs
- [x] Live total amount calculation (amount + GST)
- [x] Invoice number field
- [x] Category segment selector (5 categories)
- [x] Notes field
- [x] Multipart upload when photo present, JSON otherwise
- [x] Validation: supplier required, amount required + > 0

### InvoicesScreen.js
- [x] useFocusEffect reload
- [x] Pending count subtitle
- [x] Invoice cards: number, supplier, category, date, amount, status badge
- [x] Manager remarks display on rejected invoices
- [x] One-tap "+ Upload" button

## ✅ Navigation
- [x] EngineerNavigator updated: MaterialLog + InvoiceUpload stack screens
- [x] Deep-link params: MaterialLog receives defaultType + preselected material
- [x] Tab bar: green engineer accent

## 🔜 Step 7 Options
- [ ] Cloudinary/S3 signed URL upload for invoice photos
- [ ] Material purchase order flow
- [ ] Daily site diary (notes + photos)
- [ ] Admin analytics dashboard (charts)
- [ ] Offline-first sync indicator bar
