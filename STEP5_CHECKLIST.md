# Step 5 Completion Checklist

## ✅ Push Notifications (FCM)

### Backend
- [x] fcmHelper.js — firebase-admin SDK wrapper (sendPush, sendMulticast)
  - Supports FIREBASE_SERVICE_ACCOUNT_JSON (env var) and path-based config
  - Per-message android priority + apns badge settings
  - Graceful degradation when Firebase not configured
- [x] notificationHelper.js — upgraded to fire FCM after every DB insert
  - Looks up user.fcmToken before each push
  - Updates Notification record with pushStatus (sent/failed)
- [x] User model — fcmToken field added (select: false)
- [x] PUT /auth/fcm-token — device registers token on login
- [x] firebase-admin added to backend package.json

### Mobile (React Native)
- [x] pushNotificationService.js — full client implementation
  - requestPermission (iOS + Android 13+)
  - registerFCMToken (gets token + calls backend)
  - setupForegroundHandler (dispatches toast instead of Alert)
  - setupBackgroundHandler (required Firebase handler)
  - onTokenRefresh (keeps backend token fresh)
- [x] @react-native-firebase/app + /messaging added to mobile package.json
- [x] App.js — registers FCM on login, handles foreground + background + app-restore

### Toast Notification System
- [x] toastSlice.js — Redux slice for in-app toast queue
- [x] ToastContainer.js — animated floating toasts with type icons + auto-dismiss
- [x] 12 notification types mapped to colors/icons

## ✅ Engineer Screens (Full Rewrite)

### EngineerDashboard.js
- [x] useFocusEffect reload on tab focus
- [x] Live unread notification count with bell + badge
- [x] Site progress bar
- [x] 3-stat pill row (Present Today / Low Stock / Pending Invoices)
- [x] Unread notification strip (yellow, links to NotificationsScreen)
- [x] Quick action list with label + description (replaced grid tiles)
- [x] ToastContainer overlay

### AttendanceScreen.js
- [x] Large clock display (52pt font) with current time
- [x] Today status chips (Check IN / Check OUT with approval status)
- [x] Check IN + Check OUT buttons (full width, color coded)
- [x] Offline enqueue with immediate UI update
- [x] History list with IN/OUT type arrows + approval badge

## ✅ Shared Screens

### NotificationsScreen.js
- [x] useFocusEffect reload
- [x] 12 notification types with color-coded icons
- [x] Unread / All filter toggle
- [x] Tap to mark individual read
- [x] Mark All Read button
- [x] Unread dot indicator per notification

## ✅ PDF Report Generation (Backend)

### reportController.js — 3 report types
- [x] generateSiteSummary — dark themed A4 PDF
  - Header bar (BuildTrack AI branding)
  - Site overview (code, location, status, progress)
  - Budget overview with line item table
  - Worker count + trade breakdown
  - Materials table with stock value
  - Payment + Invoice summary
- [x] generatePaymentRegister — filtered by date range
  - Summary (total records, approved, amount)
  - Full payment table (payee, type, period, method, amount, status)
  - Grand total line
- [x] generateInvoiceSummary
  - Summary (total, approved, pending, values)
  - Full invoice table (number, supplier, category, date, amount, status)
- [x] reportRoutes.js — all protected with JWT + siteAccess RBAC
- [x] pdfkit added to backend package.json
- [x] /api/v1/reports registered in server.js

## ✅ Web Manager Dashboard

### ManagerLayout.jsx
- [x] Blue accent (manager vs amber admin)
- [x] 7-item nav (Dashboard, Workers, Attendance, Materials, Payments, Invoices, Reports)
- [x] Live notification bell with unread badge (polls every 45s)
- [x] User profile footer with logout

### Manager Web Pages
- [x] ManagerDashboard.jsx — live KPIs, pending action items, budget bar, progress bar
- [x] ManagerWorkersPage.jsx — full worker table + Add/Edit modal (full CRUD)
- [x] ManagerReportsPage.jsx — one-click PDF downloads with date picker for payments

### Services
- [x] reportService.js — PDF download helper (Blob → link click)

### App.jsx
- [x] Manager routes added (/manager/dashboard, /manager/workers, /manager/reports)
- [x] Role-based redirect on login (admin → /admin/dashboard, manager → /manager/dashboard)

## 🔜 Step 6 Options
- [ ] Cloudinary/S3 invoice photo upload
- [ ] Daily Site Diary (notes + photos per day)
- [ ] Material purchase orders
- [ ] FCM topic subscriptions (broadcast to all site managers)
- [ ] Engineer web view
- [ ] Attendance reports PDF
