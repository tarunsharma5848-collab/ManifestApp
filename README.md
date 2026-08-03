# Manifest — Manifestation App

Web-first (Capacitor/React Native wrap later) manifestation app: vision board, daily affirmations,
369-method journal, and goal tracker. Cosmic/night-sky visual theme.

## Stack
- **Frontend:** React + Vite + Tailwind CSS v4, React Router
- **Backend:** Node.js + Express
- **DB:** PostgreSQL
- **Auth:** Email OTP (Resend) → JWT
- **Images:** Cloudinary (not yet wired — see `visionBoard.js` route)

## Structure
```
manifestation-app/
├── frontend/          React app (Vite)
│   └── src/
│       ├── pages/         Login, Dashboard, VisionBoard, Affirmations, Journal, Goals
│       ├── components/    Layout (sidebar nav)
│       ├── context/       AuthContext (OTP login, JWT storage)
│       └── api/           axios client with auth interceptor
└── backend/           Express API
    └── src/
        ├── routes/        auth, visionBoard, affirmations, journal, goals
        ├── controllers/   authController (OTP request/verify/me)
        ├── middleware/     requireAuth (JWT check)
        ├── config/         db.js (PG pool), email.js (Resend OTP sender)
        └── db/schema.sql   Postgres schema
```

## Getting started

### 1. Database
Create a Postgres DB and run the schema:
```bash
psql -d your_db -f backend/src/db/schema.sql
```

### 2. Backend
```bash
cd backend
cp .env.example .env   # fill in DATABASE_URL, JWT_SECRET, RESEND_API_KEY etc.
npm install
npm run dev             # http://localhost:5000
```
Without `RESEND_API_KEY` set, OTPs are logged to the console instead of emailed — handy for local dev.

### 3. Frontend
```bash
cd frontend
npm install
npm run dev              # http://localhost:5173, proxies /api to :5000
```

## What's built vs. what's next
**Done:** full OTP login flow (request → verify → JWT session), protected routing, sidebar nav,
cosmic theme design tokens, DB schema for all 5 feature areas, placeholder pages/routes for each feature.

**Next up:**
- Vision board: Cloudinary upload + image grid CRUD
- Affirmations: CRUD + "today's affirmation" rotation logic
- Journal: 369-method entry editor + streak tracking
- Goals: CRUD + progress/status updates
- Real email OTP (add `RESEND_API_KEY`) and rate-limiting on `/request-otp`
