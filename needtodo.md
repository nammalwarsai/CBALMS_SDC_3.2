# CBALMS — Bugs, Errors & Improvements

> Full codebase audit — April 16, 2026

---

## 🔴 CRITICAL — Must Fix

### 1. ~~Password Reset Redirects to `localhost:3000`~~ ✅ FIXED
- **Files:** `backend/.env`, `backend/src/controllers/passwordController.js`, `backend/src/routes/passwordRoutes.js`
- **Issue:** `FRONTEND_URL` in backend `.env` was `http://localhost:3000`. Supabase recovery emails redirected users to localhost instead of the deployed Vercel app.
- **Fix Applied:**
  - Updated `backend/.env` → `FRONTEND_URL=https://cbalms-sdc-3-2.vercel.app`
  - Fixed `passwordController.js` to strip trailing slashes and prevent email enumeration
  - Wired up `passwordRoutes.js` (was a placeholder returning a static string)

### 2. ⚠️ Supabase Dashboard — Redirect URL Whitelist (MANUAL ACTION REQUIRED)
- **Issue:** Supabase only allows redirect URLs that are whitelisted in the project dashboard. If `https://cbalms-sdc-3-2.vercel.app/reset-password` is NOT in the list, Supabase silently falls back to the Site URL (localhost), breaking the reset flow.
- **Fix Required (Manual):**
  1. Go to **Supabase Dashboard** → **Authentication** → **URL Configuration**
  2. Set **Site URL** to: `https://cbalms-sdc-3-2.vercel.app`
  3. Add to **Redirect URLs**: `https://cbalms-sdc-3-2.vercel.app/**`
  4. Keep `http://localhost:3000/**` in Redirect URLs for local development

### 3. ⚠️ Render Backend — `FRONTEND_URL` Environment Variable (MANUAL ACTION REQUIRED)
- **Issue:** The `.env` file is only for local dev. On Render, environment variables must be set in the Render dashboard.
- **Fix Required (Manual):**
  1. Go to **Render Dashboard** → Your backend service → **Environment**
  2. Set `FRONTEND_URL` = `https://cbalms-sdc-3-2.vercel.app`
  3. Redeploy the service

### 4. ⚠️ Backend `.env` — Possible Wrong Service Role Key
- **File:** `backend/.env`
- **Issue:** `SUPABASE_SERVICE_ROLE_KEY` is set to `sb_publishable_...`. Supabase publishable keys are **anon keys**, not service role keys. The service role key typically starts with `eyJhbGciOi...` (a JWT). If this is the anon key, then `supabase.auth.admin.updateUserById()` in the password controller will fail with a permissions error.
- **Fix Required (Manual):**
  1. Go to **Supabase Dashboard** → **Settings** → **API**
  2. Copy the **service_role** key (the one marked as secret)
  3. Update both local `.env` and Render environment variables

### 5. ⚠️ Vercel Frontend — API URL Environment Variable (MANUAL ACTION REQUIRED)
- **File:** `frontend/.env` has `REACT_APP_API_URL=http://localhost:5000/api`
- **Issue:** On Vercel, the frontend needs to point to the Render backend URL, not localhost.
- **Fix Required (Manual):**
  1. Go to **Vercel Dashboard** → Your project → **Settings** → **Environment Variables**
  2. Set `REACT_APP_API_URL` = `https://your-render-backend-url.onrender.com/api`
  3. Also set `REACT_APP_SUPABASE_URL` and `REACT_APP_SUPABASE_ANON_KEY`
  4. Redeploy

---

## 🟡 BUGS — Should Fix

### 6. `passwordRoutes.js` Was a Placeholder ✅ FIXED
- **File:** `backend/src/routes/passwordRoutes.js`
- **Issue:** The routes file had a single dummy route (`POST /password`) returning `"Password route working"`. It never connected to the `passwordController.js` methods. The `forgotPasswordSchema` and `resetPasswordSchema` validators existed in `validate.js` but were unused.
- **Fix Applied:** Wired up `POST /forgot-password` and `POST /reset-password` with proper validation.

### 7. Auth Rate Limiter Too Strict for Password Reset
- **File:** `backend/server.js` (line 89-95)
- **Issue:** The `authLimiter` limits to 10 requests per 15 minutes. Password routes share this limiter. If a user fails to reset, they can get locked out from even requesting another reset email.
- **Suggestion:** Create a separate, slightly less strict rate limiter for password reset endpoints (e.g., 5 requests per 15 minutes for forgot-password, separate from login attempts).

### 8. `ForgotPassword.js` — Dual Path Confusion
- **Files:** `frontend/src/pages/ForgotPassword.js`, `frontend/src/services/authService.js`
- **Issue:** The `ForgotPassword.js` page calls `supabase.auth.resetPasswordForEmail()` directly from the frontend, but `authService.js` also exports a `forgotPassword()` function that calls the backend API (`POST /api/auth/forgot-password`). This creates two different code paths for the same feature. The frontend-direct approach is correct (it stores the PKCE code verifier in the browser's localStorage), so the backend `forgotPassword` endpoint is technically redundant for this flow.
- **Suggestion:** Keep the frontend-direct Supabase call (current approach is correct). Document that the backend endpoint exists as an alternative for non-PKCE flows.

### 9. Missing `NODE_ENV` in Production
- **File:** `backend/.env`, Render dashboard
- **Issue:** `NODE_ENV` is not set anywhere. The error handler in `errorHandler.js` checks `process.env.NODE_ENV === 'development'` to decide whether to expose stack traces. Without it set, production will leak stack traces to clients.
- **Fix Required:** Set `NODE_ENV=production` on Render dashboard.

### 10. No 404 Catch-All Route
- **File:** `backend/server.js`
- **Issue:** There's no fallback route for undefined endpoints. Requests to non-existent routes will hang or return default Express errors instead of a clean JSON response.
- **Suggestion:** Add before the error handler:
  ```js
  app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
  });
  ```

---

## 🟢 IMPROVEMENTS — Nice to Have

### 11. Create `.env.example` Files
- **Files:** `backend/.env.example`, `frontend/.env.example`
- **Issue:** No `.env.example` files exist for documentation. Team members or future deployments won't know what environment variables are needed.
- **Suggestion:** Create `.env.example` files with placeholder values showing all required keys.

### 12. `ResetPassword.js` — Password Strength Validation
- **File:** `frontend/src/pages/ResetPassword.js`
- **Issue:** The form text says "Password must be at least 8 characters and include uppercase, lowercase, number, and special character" but there's no client-side validation enforcing this before submission. The validation only happens on the backend (via Joi schema).
- **Suggestion:** Add client-side password strength validation to match the backend `resetPasswordSchema` regex pattern, and show real-time feedback as the user types.

### 13. `authService.js` — Unused `forgotPassword` / `resetPassword` Functions
- **File:** `frontend/src/services/authService.js`
- **Issue:** The `forgotPassword()` and `resetPassword()` functions in authService make API calls to the backend, but the actual `ForgotPassword.js` and `ResetPassword.js` pages call Supabase directly. These service functions are dead code.
- **Suggestion:** Either remove them or document them as alternative backend-based flow.

### 14. `AuthContext.js` — No Error Boundary for Auth Failures
- **File:** `frontend/src/context/AuthContext.js`
- **Issue:** If `authService.getCurrentUser()` throws a network error, the error is caught and logged but the user silently loses their session. No toast or UI feedback is shown.
- **Suggestion:** Add toast notification for session expiry so users know they need to log in again.

### 15. Hardcoded `SUPABASE_SERVICE_ROLE_KEY` Name Confusion
- **File:** `backend/.env`
- **Issue:** The key is named `SUPABASE_SERVICE_ROLE_KEY` but appears to contain an anon/publishable key (`sb_publishable_...`). This makes debugging auth issues very confusing.
- **Suggestion:** Add a comment or validation that checks the key format on startup.

### 16. `server.js` — CORS Wildcard Regex Injection Risk
- **File:** `backend/server.js` (line 52)
- **Issue:** The wildcard CORS pattern uses `allowed.replace(/\*/g, '.*')` which converts `*` to `.*` regex. If `FRONTEND_URL` env var contains malicious regex patterns, it could cause ReDoS. Low risk since env vars are server-controlled, but worth noting.
- **Suggestion:** Use a simpler glob-to-regex library or validate patterns on startup.

### 17. Missing `helmet` CSP Configuration
- **File:** `backend/server.js`
- **Issue:** `helmet()` is used with defaults, which sets a restrictive Content-Security-Policy. This is fine for an API server but worth verifying it doesn't block any functionality.
- **Suggestion:** Review and customize helmet options if serving any HTML content.

### 18. `frontend/.env` — Sensitive Keys in Git
- **File:** `frontend/.env`
- **Issue:** The `.env` file may be committed to Git (check `.gitignore`). While the Supabase anon key is designed to be public (it's used client-side), the `REACT_APP_API_URL` should be environment-specific.
- **Suggestion:** Verify `.gitignore` includes both `frontend/.env` and `backend/.env`. Use `.env.local` for local overrides.

### 19. `Login.js` — Double Submit on Enter Key
- **File:** `frontend/src/pages/Login.js` (lines 58-62)
- **Issue:** The `handleKeyDown` on the password field calls `handleSubmit(e)` on Enter, but the form already has `onSubmit={handleSubmit}`. Pressing Enter in the password field fires both the keydown handler AND the form submit event, potentially causing a double submission.
- **Suggestion:** Remove the `handleKeyDown` handler since the form's native submit behavior already handles Enter key.

### 20. Body Size Limit — Profile Photos
- **File:** `backend/server.js` (line 75)
- **Issue:** Body limit is set to `10mb`. Profile photos are sent as base64 strings in the request body. Large high-resolution photos could exceed this limit. The previous limit was 50mb (noted in the comment).
- **Suggestion:** Consider using a streaming upload approach (e.g., Supabase Storage or pre-signed URLs) instead of base64 in JSON body.

### 21. `cronService.js` — No Error Recovery
- **File:** `backend/src/services/cronService.js`
- **Issue:** Cron jobs are initialized at startup but if they fail, there's no retry mechanism or alerting.
- **Suggestion:** Add error logging and optional retry logic for critical cron jobs.

### 22. Missing `vercel.json` Rewrites for SPA Routing
- **Issue:** React Router uses client-side routing. If a user directly navigates to `https://cbalms-sdc-3-2.vercel.app/reset-password`, Vercel needs to serve `index.html` for all routes. Without proper rewrites, direct URL access will return 404.
- **Suggestion:** Create or verify `vercel.json`:
  ```json
  {
    "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
  }
  ```

---

## 📋 Summary of Actions Needed

| # | Action | Type | Who |
|---|--------|------|-----|
| 1 | ~~Fix password routes & controller~~ | Code | ✅ Done |
| 2 | Update Supabase Dashboard URLs | Manual | You |
| 3 | Set `FRONTEND_URL` on Render | Manual | You |
| 4 | Verify Supabase service role key | Manual | You |
| 5 | Set env vars on Vercel | Manual | You |
| 6 | ~~Wire up password routes~~ | Code | ✅ Done |
| 7 | Separate rate limiter for password | Code | Future |
| 8 | Clean up dual forgot-password paths | Code | Future |
| 9 | Set `NODE_ENV=production` on Render | Manual | You |
| 10 | Add 404 catch-all route | Code | Future |
| 11 | Create `.env.example` files | Code | Future |
| 12 | Client-side password validation | Code | Future |
| 19 | Fix double-submit on Login Enter key | Code | Future |
| 22 | Verify Vercel SPA rewrites | Config | You |
