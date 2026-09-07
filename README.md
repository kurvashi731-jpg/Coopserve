# CoopServe — Cooperative Gig Services Platform

A hyperlocal platform organizing household service workers (plumbers, electricians,
cleaners, cooks, tutors, gardeners) into verified worker cooperatives — with a
**fully transparent commission ledger** so every rupee's split is visible to
customers, workers, and cooperative admins.

## Project structure

```
sevasetu/
├── backend/    Express + MongoDB API
└── frontend/   React (Vite) + Tailwind app
```

## 1. Set up MongoDB Atlas (free)

1. Go to https://www.mongodb.com/cloud/atlas/register and create a free account.
2. Create a free M0 cluster.
3. Under "Database Access," create a user with a username/password.
4. Under "Network Access," add `0.0.0.0/0` (allow access from anywhere) for the hackathon.
5. Click "Connect" → "Drivers" → copy the connection string. It looks like:
   `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/`

## 2. Backend setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` and paste your MongoDB connection string into `MONGO_URI` (add `/sevasetu`
before the `?` to name the database), and set any random string as `JWT_SECRET`.

```bash
npm run seed   # populates demo data (cooperatives, workers, bookings, reviews, ledger)
npm run dev    # starts the API on http://localhost:5000
```

Demo login credentials (password for all: `Demo@1234`):
- Cooperative Admin: `admin1@coopserve.demo`, `admin2@coopserve.demo`
- Customer: `customer1@coopserve.demo` through `customer4@coopserve.demo`
- Worker: `worker1@coopserve.demo` through `worker14@coopserve.demo`

## 3. Frontend setup

Open a **new terminal**:

```bash
cd frontend
npm install
cp .env.example .env   # default already points to http://localhost:5000/api
npm run dev
```

Visit **http://localhost:5173** in your browser.

## 4. Demo flow for judges

1. Log in as a **customer** → browse categories → open a worker profile → book them.
2. Log in as that **worker** (e.g. `worker1@coopserve.demo`) → accept the job → mark
   in progress → mark completed. This auto-generates a ledger transaction.
3. Check the worker's **Earnings** page — see the transparent payout split.
4. Log in as the matching **cooperative admin** → open **Ledger** → see the same
   transaction aggregated across all members, plus the welfare fund balance growing.
5. Go back to the customer's booking → leave a review.

## 5. Deploying (optional, for a live demo link)

- **Backend** → Render or Railway (free tier): set the same environment variables
  from `.env`, root directory `backend`, build command `npm install`, start command `npm start`.
- **Frontend** → Vercel (free tier): root directory `frontend`, framework preset "Vite",
  set `VITE_API_URL` to your deployed backend URL + `/api`.

## Tech stack

React (Vite) · Tailwind CSS · React Router · Axios · lucide-react · react-hot-toast
· Node.js · Express · MongoDB Atlas · Mongoose · JWT · bcryptjs

## Standout features

- **Transparent Commission Ledger** — every booking shows the exact split between
  worker payout, platform fee, and cooperative welfare fund (visible to customer,
  worker, and admin alike).
- **Cooperative verification** — workers only earn a "Verified" badge once their
  cooperative admin approves them, building real community trust instead of a
  faceless platform rating.
- **Trust Score** — a rolling score built from verification status + review history,
  shown on every worker card.
