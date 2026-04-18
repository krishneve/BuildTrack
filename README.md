# BuildTrack AI – Smart Construction Management System

> A **mobile-first, AI-powered construction management platform** built for real-world field operations.  
> Manages inventory, workers, payments, invoices, and budgets across multiple construction sites.

---

## 🏗️ System Overview

```
┌────────────────────────────────────────────────────────────────┐
│                       CLIENT LAYER                             │
│  Web Admin Dashboard (React + Tailwind)                        │
│  Mobile App (React Native) — Engineer & Manager               │
└──────────────────────┬─────────────────────────────────────────┘
                       │ REST API (JWT)
┌──────────────────────▼─────────────────────────────────────────┐
│              Node.js + Express Backend                          │
│  RBAC · Attendance · Inventory · Payments · Invoices · Budget  │
└──────────┬────────────────────────────┬───────────────────────-┘
           │ MongoDB                    │ HTTP proxy
┌──────────▼───────────┐  ┌────────────▼───────────────────────┐
│  MongoDB Atlas / Local│  │  Python FastAPI AI Service          │
│  All data storage     │  │  Forecasting · Anomaly · Alerts    │
└──────────────────────-┘  └────────────────────────────────────┘
```

---

## ✨ Features

### 🔐 Role-Based Access Control (RBAC)
- **Admin** — Multi-site overview, budgets, users, analytics, AI insights
- **Site Manager** — Approve attendance/payments/invoices, manage workers, site dashboard
- **Site Engineer** — Mark attendance, log materials IN/OUT, upload invoices

### 📱 Mobile App (React Native)
- **Engineer App**: Attendance clock, material log with large-touch UI, invoice camera upload
- **Manager App**: Approval workflows, worker management, real-time site KPIs
- **Offline Support**: AsyncStorage queue syncs automatically when connectivity restored
- **Push Notifications**: Firebase Cloud Messaging for approval alerts

### 📦 Inventory Management
- Real-time stock tracking per site
- Low-stock alerts with push notifications
- Full audit log of every IN/OUT transaction

### 💰 Budget & Payment Tracking
- Per-site budget allocation with line items by category
- Auto-update on invoice approval and payment approval
- Budget status: on_track → at_risk (>80%) → overrun (>100%)

### 📄 Invoice & Payment Workflows
- Engineer uploads invoice → Manager approves → Budget updates
- Worker attendance → Manager approves → Payment generated
- PDF reports: Site Summary, Payment Register, Invoice Summary

### 🧠 AI Features (Python FastAPI)
- **Material Demand Forecasting**: 7-day prediction using rolling avg + linear regression
- **Cost Overrun Detection**: Spending velocity analysis + budget projection
- **Anomaly Detection**: Z-score based unusual usage detection
- **Smart Alerts**: Combined rule-based + AI signals in one endpoint

---

## 🛠️ Tech Stack

| Layer       | Technology                              |
|-------------|------------------------------------------|
| Frontend    | React 18, Tailwind CSS, React Router     |
| Mobile      | React Native 0.73, Redux Toolkit         |
| Backend     | Node.js, Express, Mongoose, JWT          |
| Database    | MongoDB (Atlas or local)                 |
| AI Service  | Python 3.11+, FastAPI, scikit-learn      |
| Push Notifs | Firebase Cloud Messaging (FCM)           |
| PDF Reports | PDFKit                                   |

---

## 📁 Folder Structure

```
BuildTrackAI/
├── backend/           # Node.js + Express API
│   ├── config/        # DB, constants, RBAC
│   ├── controllers/   # Business logic (14 controllers)
│   ├── middleware/     # Auth, RBAC guards
│   ├── models/        # 10 Mongoose schemas
│   ├── routes/        # All API routes
│   └── utils/         # Helpers, FCM, notifications, PDF
│
├── frontend/          # React web dashboard (Admin + Manager)
│   └── src/
│       ├── components/ # Layout, common UI
│       ├── pages/      # Admin, Manager pages
│       └── services/   # API service layer
│
├── mobile-app/        # React Native (Engineer + Manager)
│   └── src/
│       ├── screens/   # All role screens
│       ├── navigation/ # Role-based navigators
│       ├── services/  # API + FCM + offline queue
│       └── store/     # Redux slices
│
└── ai-service/        # Python FastAPI ML service
    ├── routes/        # Predict, anomaly, alerts endpoints
    ├── services/      # Forecasting, cost analysis, anomaly
    └── utils/         # MongoDB connection
```

---

## ⚙️ Installation

### Prerequisites
- Node.js 18+
- Python 3.11+
- MongoDB (local or Atlas)
- React Native environment (Android Studio / Xcode)

---

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env — set MONGO_URI and JWT secrets
npm run dev          # starts on port 5000
```

**Seed sample data:**
```bash
node utils/seed.js
```

---

### 2. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env    # set REACT_APP_API_URL=http://localhost:5000/api/v1
npm start               # starts on port 3000
```

---

### 3. Mobile App Setup

```bash
cd mobile-app
npm install

# Android
npm run android

# iOS
cd ios && pod install && cd ..
npm run ios
```

**Configure API URL in** `src/services/api.js`:
```js
// Android emulator:   http://10.0.2.2:5000/api/v1
// iOS simulator:      http://localhost:5000/api/v1
// Physical device:    http://<your-local-ip>:5000/api/v1
```

---

### 4. AI Service Setup

```bash
cd ai-service
pip install -r requirements.txt
cp .env.example .env    # set MONGO_URI same as backend
uvicorn main:app --reload --port 8000
```

**Test AI service:**
```
GET http://localhost:8000/health
```

---

## 🔐 Environment Variables

### Backend `.env`

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# MongoDB
MONGO_URI=mongodb://localhost:27017/buildtrack_ai

# JWT
JWT_SECRET=your_32_char_minimum_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here

# AI Service
AI_SERVICE_URL=http://localhost:8000
AI_SECRET_KEY=buildtrack_ai_secret_key_2025

# Firebase (optional — for push notifications)
# FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
```

### AI Service `.env`

```env
MONGO_URI=mongodb://localhost:27017/buildtrack_ai
PORT=8000
AI_SECRET_KEY=buildtrack_ai_secret_key_2025
```

---

## 👤 Default Login Credentials

After running `node utils/seed.js`:

| Role            | Email                              | Password      |
|-----------------|------------------------------------|---------------|
| Admin           | admin@samarthdevelopers.com        | Admin@12345   |
| Site Manager    | rakesh@samarthdevelopers.com       | Manager@123   |
| Site Engineer   | amit@samarthdevelopers.com         | Engineer@123  |

---

## 📱 Usage Guide

### Admin (Web Dashboard)
1. Login → `/admin/dashboard` — multi-site overview
2. **Sites** — create/edit sites, assign manager + engineers
3. **Budget** — set per-site budgets with category breakdown
4. **Inventory** — view stock levels, add materials to catalogue
5. **Invoices** — view all site invoices, approve/reject
6. **Payments** — payment register with approve/reject
7. **AI Insights** — real-time forecasts, cost risk, anomaly detection
8. **Reports** — download PDF reports (Site Summary, Payment Register, Invoice Summary)

### Manager (Mobile App)
1. Login → Manager Dashboard → pending approval count
2. **Workers tab** — add/edit/pay workers
3. **Attendance** — approve/reject check-ins (one tap)
4. **Materials** — view stock, log IN/OUT
5. **Payments** — approve weekly/monthly payments
6. **Reports** — download PDF reports

### Engineer (Mobile App)
1. Login → Engineer Dashboard → today's summary
2. **Attendance tab** → tap CHECK IN / CHECK OUT
3. **Materials tab** → select material → enter quantity → LOG
4. **Invoices tab** → tap "+ Upload" → photo + supplier + amount → SUBMIT

---

## 🔄 Business Workflow

```
Engineer marks attendance
    → Manager approves attendance
        → Payment generated (weekly labor)
            → Manager approves payment
                → Budget updated

Engineer logs material OUT
    → Stock decreases automatically
        → Cost added to site spending
            → Budget updated in real-time

Engineer uploads invoice
    → Manager approves invoice
        → Budget updated (category line item)
            → Payment record created
```

---

## 🧠 AI API Reference

All AI endpoints require: `x-api-key` header = value from `AI_SECRET_KEY`  
Or call via backend proxy (JWT auth): `GET /api/v1/ai/<endpoint>`

| Endpoint                           | Description                              |
|------------------------------------|------------------------------------------|
| `GET /ai/predict-material/:siteId` | 7-day material demand forecast           |
| `GET /ai/cost-overrun/:siteId`     | Budget risk + spending velocity          |
| `GET /ai/anomaly/:siteId`          | Unusual material usage detection         |
| `GET /ai/smart-alerts/:siteId`     | All AI + rule-based alerts combined      |
| `GET /api/v1/ai/dashboard/:siteId` | All AI signals in one call (via backend) |

---

## 📊 Sample Data (seeded)

- **3 Users**: Admin (Suresh Samarth), Manager (Rakesh Patil), Engineer (Amit Deshmukh)
- **3 Sites**: Samarth Residency Phase 1, Samarth Commercial Hub, Samarth Villa Township
- **6 Materials**: Cement, TMT Steel, Red Bricks, River Sand, Aggregate, Safety Helmets
- **8 Workers**: Masons, carpenters, electricians across 2 sites
- **3 Invoices**: 1 approved, 2 pending
- **4 Payments**: 2 approved, 2 pending
- **2 Budgets**: ₹1.2Cr (Site 1), ₹85L (Site 2)

---

## 🚀 Running All Services

```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm start

# Terminal 3 — AI Service
cd ai-service && uvicorn main:app --reload --port 8000

# Terminal 4 — Mobile
cd mobile-app && npm run android
```

---

## 📦 Project Credits

Built for **Samarth Developers, Nashik** — a real-world construction company.

| Tech             | Version  |
|------------------|----------|
| Node.js          | 18.x     |
| React            | 18.2     |
| React Native     | 0.73     |
| FastAPI          | 0.109    |
| MongoDB          | 7.x      |
| scikit-learn     | 1.4      |

---

*BuildTrack AI — Making construction management smarter, faster, and data-driven.*
