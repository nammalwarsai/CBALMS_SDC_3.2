

## 1. Bugs & Potential Issues



### CRITICAL: Double Leave Balance Deduction on Approval

**File:** `backend\src\controllers\leaveController.js:186-191`

When a leave is approved, the controller explicitly calls `LeaveBalanceModel.deductBalance()`:

```js
if (status === 'Approved') {
    const workingDays = calculateWorkingDays(existingLeave.start_date, existingLeave.end_date);
    await LeaveBalanceModel.deductBalance(existingLeave.employee_id, ...);
}
```

But the database also has a trigger `trigger_update_leave_balance` (`database_schema.sql:104-107`) that fires `AFTER UPDATE OF status ON leaves` and deducts the same balance. This means **every approval deducts leave days twice** -- once from application code, once from the database trigger. The same duplication exists for cancellation restoration via `restoreBalance()` in `leaveController.js:108-110` vs. the trigger's reversal logic at `database_schema.sql:85-96`.

**Impact:** Employees' leave balances will show double the actual usage. A 2-day leave will consume 4 days from the balance.

---

### CRITICAL: Writing to Computed Column `remaining_days`

**File:** `backend\src\models\leaveBalanceModel.js:99-103` and `113-125`

```js
const { data, error } = await supabase
    .from('leave_balances')
    .update({ used_days: newUsed, remaining_days: newRemaining })
```

The `remaining_days` column is defined as `GENERATED ALWAYS AS (total_days - used_days) STORED` in `database_schema.sql:8`. Attempting to write to a generated column will cause a PostgreSQL error. The `remaining_days` field must be removed from all `.update()` calls since it's auto-computed.

---

### HIGH: Password Routes File is a Stub -- Forgot/Reset Password Backend is Non-Functional

**File:** `backend\src\routes\passwordRoutes.js`

```js
router.post('/password', (req, res) => {
  res.send('Password route working');
});
```

The `passwordController.js` defines `forgotPassword` and `resetPassword` handlers, but `passwordRoutes.js` never imports or mounts them. The route is just a test stub. The frontend's `ForgotPassword.js` works around this by calling Supabase directly from the client, but the `ResetPassword` page also uses the Supabase client directly, making the backend's `passwordController.js` entirely dead code.

**Impact:** The password reset flow works by accident (frontend calls Supabase directly), but the backend validation middleware (`forgotPasswordSchema`, `resetPasswordSchema`) defined in `validate.js:51-71` is never actually applied, meaning no server-side validation of these inputs.

---

### HIGH: No Role-Based Route Protection on Frontend

**File:** `frontend\src\components\PrivateRoute.js`

```js
const PrivateRoute = ({ children }) => {
  const { user } = useContext(AuthContext);
  if (!user) return <Navigate to="/login" />;
  return children;
};
```

PrivateRoute only checks if a user is logged in -- it does **not** check the user's role. An employee can manually navigate to `/admin-dashboard` and the component will render. While the API calls will fail on admin-only endpoints (returning 403), the admin UI itself is fully visible, exposing admin features and layout.

---

### HIGH: Frontend Supabase Client Created Without Null Checks

**File:** `frontend\src\config\supabaseClient.js:3-6`

```js
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

No `.env` file exists in the frontend directory. If `REACT_APP_SUPABASE_URL` or `REACT_APP_SUPABASE_ANON_KEY` are not set, `createClient` receives `undefined`, which will cause a runtime crash. Unlike the backend which at least warns, the frontend has no guard at all.

---

### MEDIUM: Server Timezone Dependency for Attendance

**File:** `backend\src\controllers\attendanceController.js:19`

```js
const today = new Date().toISOString().split('T')[0];
```

This uses the server's UTC time to determine "today". But check-in/check-out times are formatted using `Asia/Kolkata` timezone (`attendanceController.js:6`). If the server runs in UTC (standard for cloud deployments), a user checking in at 11 PM IST will have `today` as the next day's UTC date, causing **timezone mismatches** between the date field and the formatted time. This could result in "Already checked in" errors or records landing on the wrong date.

---

### MEDIUM: Leave Remarks Shared Across All Leave Rows

**File:** `frontend\src\pages\AdminDashboard.js:630-637`

```js
value={selectedLeave === leave.id ? leaveRemarks : ''}
onChange={(e) => {
    setSelectedLeave(leave.id);
    setLeaveRemarks(e.target.value);
}}
```

There's a single `leaveRemarks` state for all leave requests in the table. If an admin types remarks for one leave, then clicks the Approve/Reject button on a **different** leave, the `leaveRemarks` value still holds the previous leave's text. The `handleApproveLeave` and `handleRejectLeave` functions send `leaveRemarks` without checking if `selectedLeave === leaveId`, so remarks can be applied to the wrong request.

---

### MEDIUM: Profile Photo Stored as Base64 in Database

**File:** `frontend\src\pages\Profile.js:43-47`

```js
reader.readAsDataURL(file);  // converts to base64
```

Profile photos are stored as base64 strings directly in the `profiles` table. With only a 2MB client-side check, this can still produce ~2.7MB base64 strings per profile. This bloats the database, slows down all `select('*')` queries on profiles, and will hit PostgreSQL's `toast` overhead. Additionally, `saveUserToStorage` in `authService.js:10-11` deletes `profilePhotoUrl` to avoid blowing up `localStorage` -- this means the photo disappears from the user's context until the next `getMe()` call, causing a flash of the placeholder avatar.

---

### MEDIUM: `module.exports` Override Pattern in Backend

**File:** `backend\src\config\supabaseClient.js:48-49`

```js
module.exports = supabase;
module.exports.testConnection = testConnection;
```

In Node.js, `module.exports = supabase` replaces the exports object with the supabase client instance. Then `module.exports.testConnection = testConnection` adds a property directly to the supabase client object. This works accidentally because the Supabase client is an object, but it pollutes the client with a custom property. The same pattern appears in `authMiddleware.js:53-55`. A named exports object would be cleaner and less fragile.

---

### MEDIUM: No 401 Interceptor -- Stale Sessions Leave Users Stuck

**File:** `frontend\src\services\api.js`

The Axios instance has a request interceptor to attach tokens but **no response interceptor** to handle 401 responses. If a user's token expires mid-session, every API call will silently fail with 401 errors. The user remains on the dashboard seeing error toasts with no automatic redirect to login. Only `getCurrentUser` in `authService.js:56-60` handles this edge case by calling `logout()` on error.

---

### LOW: `useEffect` Missing Dependency in AdminDashboard

**File:** `frontend\src\pages\AdminDashboard.js:55-59`

```js
useEffect(() => {
    fetchEmployees();
    fetchDashboardStats();
    fetchPendingLeaves();
}, []);
```

The ESLint exhaustive-deps rule is likely suppressed. The fetch functions reference state setters and service calls. While this is "safe" due to state setter stability, `toast` from `useToast()` is referenced inside these functions and could theoretically become stale. The same pattern exists in `EmployeeDashboard.js:52-59`.

---

### LOW: CSV/PDF Export Has No Pagination Awareness

**Files:** `frontend\src\pages\EmployeeDashboard.js:289-315`, `AdminDashboard.js:213-224`

The export functions use `attendanceHistory` array from state, which is limited by backend pagination (default limit: 50 records per page). So exports only contain the first page of data, not the full history. Users may not notice they're getting incomplete reports.

---

### LOW: `getLeaveDetails` Endpoint Open to All Authenticated Users

**File:** `backend\src\routes\leaveRoutes.js:15`

```js
router.get('/:id', authenticateToken, leaveController.getLeaveDetails);
```

Any authenticated user can fetch the details of any leave request by ID (no ownership or admin check). While leave IDs are UUIDs and not guessable, this is an unnecessary information exposure.

---

