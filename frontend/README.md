# BuildTrack AI – Frontend

## Setup

```bash
npm install
cp .env.example .env
npm start
```

## Structure

```
src/
├── context/         — AuthContext (JWT state management)
├── hooks/           — useDashboard, useSites, etc.
├── services/        — Axios API service layer
├── components/
│   ├── layout/      — AdminLayout (sidebar + header shell)
│   ├── admin/       — Admin-specific reusable components
│   └── common/      — Shared UI primitives
└── pages/
    ├── auth/        — Login
    └── admin/       — Dashboard, Sites, Analytics, Budget, Users
```

## Role Routing

| Role            | Landing Page             |
|----------------|--------------------------|
| admin           | /admin/dashboard         |
| site_manager    | /manager/dashboard (Step 2) |
| site_engineer   | /engineer/dashboard (Step 3) |
