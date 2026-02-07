
## 4. NEW FEATURES

### FEATURE-01: Forgot Password / Password Reset Flow
**Priority:** High  
**Description:** Currently, the login page displays a static message: *"Forgot Password? Contact your administrator."* There is no self-service password reset mechanism. Supabase Auth already supports password reset via email.  
**Implementation Plan:**
- **Backend:** Add a `POST /api/auth/forgot-password` endpoint that calls `supabase.auth.resetPasswordForEmail(email)`.
- **Backend:** Add a `POST /api/auth/reset-password` endpoint for the actual password update using the recovery token.
- **Frontend:** Add a "Forgot Password" page (`/forgot-password`) with an email input form.
- **Frontend:** Add a "Reset Password" page (`/reset-password`) that accepts the token from the email link and lets the user set a new password.
- **UI:** Replace the static "Contact your administrator" text on the login page with a link to `/forgot-password`.

**Affected Files:**
- New: `backend/src/controllers/passwordController.js`
- New: `backend/src/routes/passwordRoutes.js`
- New: `frontend/src/pages/ForgotPassword.js`
- New: `frontend/src/pages/ResetPassword.js`
- Modified: `frontend/src/pages/Login.js`
- Modified: `frontend/src/App.js` (new routes)
- Modified: `backend/server.js` (new route registration)

---
