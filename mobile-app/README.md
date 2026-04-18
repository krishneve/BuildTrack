# BuildTrack AI – Mobile App (React Native)

## Overview

Field operations app for **Samarth Developers** engineers and managers.
Connects to the same backend as the Web Admin Dashboard.

## Architecture

```
┌────────────────────────────────────────────────────────┐
│                 React Native App                       │
│                                                        │
│  RootNavigator                                         │
│  ├── AuthNavigator (unauthenticated)                   │
│  │   └── LoginScreen                                   │
│  ├── EngineerNavigator (role: site_engineer)           │
│  │   ├── EngineerDashboard                             │
│  │   ├── AttendanceScreen (Check IN/OUT + history)     │
│  │   ├── MaterialsScreen (live stock view)             │
│  │   ├── InvoicesScreen (invoice list)                 │
│  │   ├── LogMaterialScreen (material IN/OUT)           │
│  │   └── UploadInvoiceScreen (photo + form)            │
│  ├── ManagerNavigator (role: site_manager)             │
│  │   ├── ManagerDashboard                              │
│  │   ├── WorkersScreen (daily headcount)               │
│  │   ├── ManagerMaterialsScreen (stock + alerts)       │
│  │   ├── PaymentsScreen (approve/reject)               │
│  │   └── ApproveAttendanceScreen                       │
│  └── AdminNavigator (role: admin)                      │
│      └── AdminMobileDashboard (read-only summary)      │
└───────────────────────────┬────────────────────────────┘
                            │ HTTPS + JWT
┌───────────────────────────▼────────────────────────────┐
│          Node.js + Express + MongoDB (Same Backend)    │
│  /api/v1/auth        /api/v1/dashboard                 │
│  /api/v1/attendance  /api/v1/inventory                 │
│  /api/v1/invoices    /api/v1/payments                  │
└────────────────────────────────────────────────────────┘
```

## Setup & Run

### Prerequisites
- Node.js 18+
- React Native CLI
- Android Studio (Android) / Xcode (iOS)

```bash
cd mobile-app
npm install

# Android
npm run android

# iOS
cd ios && pod install && cd ..
npm run ios
```

### Connect to Backend

Edit `src/services/api.js`:
```js
// Android emulator:
export const BASE_URL = 'http://10.0.2.2:5000/api/v1';

// iOS simulator:
export const BASE_URL = 'http://localhost:5000/api/v1';

// Physical device (replace with your machine's LAN IP):
export const BASE_URL = 'http://192.168.1.XX:5000/api/v1';
```

## State Management
Redux Toolkit is used with two slices:
- `auth` — user session, login/logout
- `network` — online/offline status, pending queue count

## Offline Support

Actions performed offline are queued in `AsyncStorage` via `offlineQueue.js`
and automatically synced when the device reconnects.

Supported offline actions:
- Mark attendance (check IN / check OUT)
- Log material IN / OUT

## Test Users (after seed)

| Email | Password | Role |
|-------|----------|------|
| amit@samarthdevelopers.com | Engineer@123 | Site Engineer |
| rakesh@samarthdevelopers.com | Manager@123 | Site Manager |
| admin@samarthdevelopers.com | Admin@12345 | Admin |
