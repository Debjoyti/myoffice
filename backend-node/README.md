# MyOffice API - Node.js + MongoDB

Backend API for MyOffice, built with Node.js, Express, and MongoDB. Ready for deployment on **Vercel**.

## Setup

### 1. Install dependencies

```bash
cd backend-node
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env` and fill in:

- **MONGO_URI** or **MONGODB_URI** – MongoDB connection string (MongoDB Atlas recommended)
- **DB_NAME** – Database name (default: `myoffice`)
- **SECRET_KEY** – JWT secret (use a strong random value in production)
- **CORS_ORIGINS** – Comma-separated allowed origins (optional)

### 3. Run locally

```bash
npm run dev
```

API runs at `http://localhost:3001`. Health check: `GET /api/health`

### 4. Seed demo data (optional)

```bash
MONGO_URI="your-atlas-connection-string" DB_NAME="myoffice" npm run seed
```

Creates sample data and demo users:
- **superadmin@demo.com** / password123 (SAAS Admin)
- **admin@demo.com** / demo123 (full demo data)
- **client@demo.com** / password123 (client)

Includes: 100 employees, 10 stores, 20 projects, 50 leads, 20 deals, 100 expenses, attendance, leave requests, purchase requests/orders, inventory, HR fields.

---

## Deploy to Vercel

### Option A: Deploy backend only

1. In Vercel, create a new project from the `backend-node` folder (or connect your repo with root `backend-node`).
2. Add environment variables:
   - `MONGO_URI` (or `MONGODB_URI`)
   - `DB_NAME`
   - `SECRET_KEY`
   - `CORS_ORIGINS` (your frontend URL, e.g. `https://myoffice.vercel.app`)
3. Deploy.

Your API will be at `https://your-project.vercel.app/api/...`

### Option B: Monorepo (frontend + backend)

If the project root contains both frontend and backend-node:

1. In the root, add a `vercel.json` with rewrites so `/api/*` goes to the backend.
2. Or move `backend-node/api` and `backend-node/lib` to the project root under `api/` and `lib/`.

### MongoDB Atlas for Vercel

1. Add `0.0.0.0/0` to your MongoDB Atlas IP Access List so Vercel’s IPs can connect.
2. Or use [Vercel’s MongoDB Atlas integration](https://vercel.com/integrations/mongodb-atlas) to connect and set env vars automatically.

---

## Frontend configuration

Set the backend URL in your frontend (e.g. via `.env`):

```
REACT_APP_BACKEND_URL=https://your-backend.vercel.app
```

The frontend expects the API at `/api/*`.

---

## API endpoints

| Method | Endpoint | Auth |
|--------|----------|------|
| GET | `/api/health` | No |
| POST | `/api/auth/register` | No |
| POST | `/api/auth/login` | No |
| GET | `/api/auth/me` | Yes |
| GET | `/api/dashboard/stats` | Yes |
| CRUD | `/api/employees`, `/api/stores` | Yes |
| POST/GET | `/api/attendance`, `/api/leave-requests` | Yes |
| POST/GET | `/api/projects`, `/api/tasks` | Yes |
| POST/GET | `/api/leads`, `/api/deals` | Yes |
| POST/GET | `/api/expenses`, `/api/inventory` | Yes |
| POST/GET | `/api/purchase-requests`, `/api/purchase-orders` | Yes |
| POST/GET | `/api/hr-fields` | Yes |
| POST/GET | `/api/team/invite`, `/api/team/invites` | Yes |
| POST/GET | `/api/subscriptions` | Yes |
| POST/GET | `/api/offer-letters` | Yes |
| GET | `/api/saas/clients` | Yes (superadmin) |
