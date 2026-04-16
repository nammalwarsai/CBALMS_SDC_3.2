# CBALMS Deployment Guide (Backend on Render + Frontend on Vercel)

This guide is tailored to your current project structure:
- Backend: Node.js/Express app in `backend/`
- Frontend: React (CRA) app in `frontend/`
- Database/Auth: Supabase is already hosted (no schema/db migration included)

---

## 1) Deployment Strategy

Deploy in this order:
1. Deploy backend to Render first.
2. Get backend public URL.
3. Deploy frontend to Vercel using the backend URL.
4. Update backend CORS/reset URL to the final Vercel URL (if needed).
5. Run post-deploy verification checklist.

Why this order matters:
- Frontend depends on `REACT_APP_API_URL`, which must point to live backend.
- Backend CORS and password reset links depend on `FRONTEND_URL`.

---

## 2) Environment Variables You Must Configure

### 2.1 Backend (Render) env vars

Set these in Render Web Service -> Environment:

Required:
- `SUPABASE_URL` = your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` = Supabase service-role key (server-side only)
- `FRONTEND_URL` = your Vercel app URL (example: `https://cbalms.vercel.app`)

Recommended:
- `NODE_ENV` = `production`
- `PORT` = leave unset (Render injects `PORT` automatically; your app already supports this)
- `AUTO_CHECKOUT_CRON` = `1 18 * * *` (or your preferred schedule)
- `LEAVE_ACCRUAL_CRON` = `0 0 1 * *` (or your preferred schedule)

If using email notifications:
- `EMAIL_USER` = sender Gmail
- `EMAIL_APP_PASSWORD` = Gmail App Password (not normal account password)

Notes from code behavior:
- App hard-fails startup if `SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY` is missing.
- `FRONTEND_URL` is used by both CORS and password reset redirect.
- If `FRONTEND_URL` is missing, backend falls back to localhost, which breaks production flow.

### 2.2 Frontend (Vercel) env vars

Set these in Vercel Project -> Settings -> Environment Variables:

- `REACT_APP_API_URL` = `https://<your-render-service>.onrender.com/api`
- `REACT_APP_SUPABASE_URL` = your Supabase URL
- `REACT_APP_SUPABASE_ANON_KEY` = Supabase anon/public key

Important:
- `REACT_APP_API_URL` must be set before Vercel build runs.
- If missing, frontend falls back to `http://localhost:5000/api` and production API calls will fail.

---

## 3) Deploy Backend to Render

### 3.1 Create the service
1. Push code to GitHub (if not already).
2. In Render: New -> Web Service.
3. Connect repository.
4. Configure:
	- Root Directory: `backend`
	- Runtime: `Node`
	- Build Command: `npm install`
	- Start Command: `npm start`

### 3.2 Add environment variables
Add all variables from section 2.1 in Render.

### 3.3 Deploy and verify
After deploy, test:
- `GET https://<render-service>.onrender.com/`

Expected response:
- `Backend is running on port ...`

If deploy fails, check Render logs for:
- missing required env vars
- invalid Supabase key
- SMTP auth errors (if email vars are set)

---

## 4) Deploy Frontend to Vercel

### 4.1 Create Vercel project
1. In Vercel: Add New Project.
2. Import same repository.
3. Configure project:
	- Root Directory: `frontend`
	- Framework Preset: `Create React App`
	- Build Command: `npm run build`
	- Output Directory: `build`

### 4.2 Add env vars
Add all variables from section 2.2.

### 4.3 Deploy
Deploy and open the Vercel URL.

---

## 5) Final Cross-Configuration Pass

After Vercel gives final domain:
1. Update Render `FRONTEND_URL` to exact Vercel domain.
2. Redeploy backend on Render.
3. Ensure frontend `REACT_APP_API_URL` still points to correct Render URL.

If you use a custom frontend domain:
- set `FRONTEND_URL` to that custom domain in Render.
- redeploy backend.

---

## 6) Post-Deployment Verification Checklist

Run these checks in production:

Core connectivity:
- Backend health path (`/`) responds.
- Frontend loads without blank screen/errors.
- Browser devtools show API calls targeting Render URL, not localhost.

Authentication:
- Signup works.
- Login works.
- Protected routes load.
- Logout works.

Password reset:
- Forgot password email generates reset link.
- Reset link opens Vercel frontend reset page (not localhost).

Domain/CORS:
- No CORS errors in browser console.
- Requests from Vercel domain are accepted by backend.

Supabase:
- Data fetch/write works via backend.
- Frontend Supabase client connects using anon key.

Email (if enabled):
- Login/logout notification emails are sent.
- Leave emails are sent (application/status flows).

Scheduled jobs:
- Auto-checkout and leave accrual logs appear over time.

---

## 7) Known Production Pitfalls (From Current Code)

1. Missing `FRONTEND_URL` in Render
	- Breaks CORS and reset redirect behavior.

2. Missing `REACT_APP_API_URL` in Vercel
	- Frontend uses localhost fallback and cannot reach backend.

3. Wrong Supabase key usage
	- Backend must use service-role key.
	- Frontend must use anon/public key only.

4. Gmail auth setup
	- Must use App Password with 2FA-enabled Gmail account.

5. Render free-tier sleeping behavior
	- Can impact background cron reliability if service sleeps.

---

## 8) Recommended One-Time Hardening Before/After Go-Live

1. Rotate exposed secrets if they were ever committed/shared (`EMAIL_APP_PASSWORD`, service keys).
2. Ensure `.env` files are gitignored (already present, verify before pushing).
3. Add distinct staging and production env values.
4. Optionally add a JSON health endpoint like `/health` for easier monitoring.

---

## 9) Quick Reference

Backend:
- Root: `backend`
- Build: `npm install`
- Start: `npm start`
- URL format: `https://<service>.onrender.com`

Frontend:
- Root: `frontend`
- Build: `npm run build`
- Output: `build`
- URL format: `https://<project>.vercel.app`

Connection:
- Frontend `REACT_APP_API_URL` -> `https://<render-service>.onrender.com/api`
- Backend `FRONTEND_URL` -> `https://<vercel-project>.vercel.app`

