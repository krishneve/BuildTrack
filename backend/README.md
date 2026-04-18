# BuildTrack AI – Backend

## Setup

```bash
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secrets
npm run dev
```

## Seed Database

```bash
cd utils && node seed.js
```

## API Health Check

```
GET http://localhost:5000/api/health
```

## Default Admin Credentials (after seed)

```
Email:    admin@samarthdevelopers.com
Password: Admin@12345
```

## Architecture

```
server.js
├── config/        — DB connection, constants, RBAC definitions
├── models/        — Mongoose schemas (User, Site, Budget)
├── middleware/    — JWT auth, RBAC authorization
├── controllers/   — Business logic
├── routes/        — Express route definitions
└── utils/         — Response helpers, logger, seeder
```
