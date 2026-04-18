# BuildTrack AI — System Architecture (Step 1: Admin Role)

## Stack
- Frontend: React.js + Tailwind CSS
- Backend: Node.js + Express
- Database: MongoDB + Mongoose
- Auth: JWT (Access + Refresh tokens)

## Project Structure

```
buildtrack-ai/
├── backend/
│   ├── config/          # DB, env, constants
│   ├── controllers/     # Business logic
│   ├── middleware/      # Auth, RBAC, error handling
│   ├── models/          # Mongoose schemas
│   ├── routes/          # Express routers
│   └── utils/           # Helpers, response formatters
└── frontend/
    └── src/
        ├── api/         # Axios service layer
        ├── components/  # Reusable UI components
        ├── context/     # Auth + App context
        ├── hooks/       # Custom hooks
        ├── pages/       # Route-level pages
        └── utils/       # Formatters, constants
```

## RBAC Design

Roles: admin | site_manager | site_engineer

Permission matrix (Step 1 — Admin only):
| Resource        | Admin  |
|----------------|--------|
| sites:create   |  ✅    |
| sites:read     |  ✅    |
| sites:update   |  ✅    |
| sites:delete   |  ✅    |
| users:create   |  ✅    |
| users:read     |  ✅    |
| users:assign   |  ✅    |
| budget:set     |  ✅    |
| budget:modify  |  ✅    |
| analytics:view |  ✅    |
| reports:export |  ✅    |
