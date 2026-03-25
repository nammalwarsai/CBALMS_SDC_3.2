# CBALMS SDC 3.2 (Cloud-Based Attendance & Leave Management System)

## 1. Project Overview

### Purpose
CBALMS is a full-stack web application that digitizes employee attendance and leave workflows. It helps organizations replace manual spreadsheets and fragmented processes with a centralized system.

### Scope
The platform supports two major user roles:
- **Employees**: mark attendance, apply/cancel leave, view holidays, manage profile/settings, and notifications.
- **Admins/HR**: approve/reject leave, monitor attendance, manage holidays, and generate reports.

### Key Features
- Secure signup/login with role-aware access
- Daily check-in/check-out with attendance history
- Leave application, approval workflow, and balance tracking
- Holiday calendar and holiday administration
- Notification center for workflow events
- Admin dashboard with employee/attendance insights
- Profile management and basic user preferences

---

## 2. System Architecture

### High-Level Architecture
CBALMS follows a **client-server architecture**:
- **Frontend (React SPA)** handles UI, routing, and user interactions.
- **Backend (Node.js/Express REST API)** handles business logic, validation, authorization, and integrations.
- **Database/Auth (Supabase/PostgreSQL + Supabase Auth)** stores domain data and manages user authentication.

### Architecture Diagram (Text Description)
```
[Browser / React Frontend]
        |
        | HTTPS (Axios REST calls with Bearer JWT)
        v
[Express API Server]
  - Route layer
  - Middleware (helmet, CORS, rate limit, auth, validation)
  - Controllers (business logic)
  - Models (Supabase data access)
        |
        | Supabase SDK
        v
[Supabase]
  - Auth users (JWT/session)
  - PostgreSQL tables (profiles, attendance, leaves, etc.)
```

### Data Flow (Example: Leave Request)
1. Employee submits leave from frontend form.
2. Frontend sends `POST /api/leaves/apply` with JWT.
3. Backend validates payload (Joi), authenticates token, checks balances and working days.
4. Backend stores leave request in `leaves` table and notifies admins.
5. Frontend receives response and updates leave history view.

---

## 3. Tech Stack Explanation

### Frontend: React + React Router + Bootstrap
- **React** for component-based SPA development.
- **React Router** for protected/public route handling and nested employee dashboard routes.
- **React Bootstrap/Bootstrap** for responsive UI and faster component styling.
- **Axios** for API communication.

### Backend: Node.js + Express
- **Express** offers lightweight, modular REST API routing.
- Middleware ecosystem (Helmet, CORS, rate-limit, Morgan, Joi) improves security, observability, and input quality.

### Database & Auth: Supabase (PostgreSQL + Auth)
- **PostgreSQL** via Supabase for relational data consistency (employees, attendance, leave, notifications).
- **Supabase Auth** for authentication/session management and JWT verification.

---

## 4. Installation & Setup Guide

### Prerequisites
- Node.js 18+ (recommended LTS)
- npm 9+
- Supabase project (URL + service role key)

### Step-by-Step Installation

#### 1) Clone and install backend
```bash
cd /home/runner/work/CBALMS_SDC_3.2/CBALMS_SDC_3.2/backend
npm install
```

#### 2) Configure backend environment (`backend/.env`)
```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
FRONTEND_URL=http://localhost:3000
PORT=5000

# Optional (email)
EMAIL_USER=your_email
EMAIL_APP_PASSWORD=your_app_password
# or
RESEND_API_KEY=your_resend_key
EMAIL_FROM=noreply@yourdomain.com

# Optional (cron overrides)
AUTO_CHECKOUT_CRON=1 18 * * *
LEAVE_ACCRUAL_CRON=0 0 1 * *
```

#### 3) Start backend
```bash
npm run dev
```

#### 4) Install frontend
```bash
cd /home/runner/work/CBALMS_SDC_3.2/CBALMS_SDC_3.2/frontend
npm install
```

#### 5) Configure frontend environment (`frontend/.env`)
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### 6) Start frontend
```bash
npm start
```

### Build & Test Commands

#### Frontend
```bash
npm start
npm run build
npm test
```

#### Backend
```bash
npm start
npm run dev
npm test  # currently placeholder script
```

---

## 5. Folder Structure

```text
CBALMS_SDC_3.2/
├── frontend/
│   ├── src/
│   │   ├── pages/            # Route-level screens
│   │   ├── components/       # Reusable UI and layout components
│   │   ├── services/         # API service modules
│   │   ├── context/          # Auth and theme context providers
│   │   ├── hooks/            # Custom hooks
│   │   └── utils/            # Utility helpers/validators
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── routes/           # API route definitions
│   │   ├── controllers/      # Business logic for endpoints
│   │   ├── models/           # Supabase data access layer
│   │   ├── middleware/       # Auth, validation, errors, request ID
│   │   ├── services/         # Email/cron and integration services
│   │   ├── config/           # Supabase client config
│   │   └── scripts/          # Utility scripts
│   ├── server.js             # API entry point
│   └── package.json
└── README.md
```

---

## 6. API Documentation

> Base URL: `http://localhost:5000/api`

### Authentication APIs (`/api/auth`)
- `POST /signup` - Register employee
- `POST /login` - Login user
- `GET /me` - Get authenticated user
- `PUT /update-profile` - Update profile
- `POST /logout` - Logout user
- `POST /password` - Placeholder route (currently returns basic success text)

#### Sample Request (Login)
```json
{
  "email": "employee@example.com",
  "password": "StrongPass@123"
}
```

#### Sample Response (Login)
```json
{
  "message": "Login successful",
  "session": {
    "access_token": "jwt-token"
  },
  "user": {
    "id": "uuid",
    "name": "Jane Doe",
    "role": "employee",
    "department": "Engineering"
  }
}
```

### Attendance APIs (`/api/attendance`)
- `POST /check-in`
- `POST /check-out`
- `GET /history/:userId?page=1&limit=50`
- `GET /status/:userId`

### Leave APIs (`/api/leaves`)
- `POST /apply`
- `GET /my-leaves?page=1&limit=50`
- `DELETE /cancel/:id`
- `GET /all?status=Pending&page=1&limit=50` (admin)
- `GET /today` (admin)
- `GET /:id`
- `PUT /:id/status` (admin)

#### Sample Request (Apply Leave)
```json
{
  "leaveType": "Sick",
  "startDate": "2026-04-01",
  "endDate": "2026-04-03",
  "reason": "Fever and recovery"
}
```

#### Sample Response (Apply Leave)
```json
{
  "message": "Leave request submitted successfully",
  "data": {
    "id": "leave-uuid",
    "employee_id": "employee-uuid",
    "leave_type": "Sick",
    "status": "Pending",
    "working_days": 3
  }
}
```

### Leave Balance APIs (`/api/leave-balances`)
- `GET /my-balances?year=2026`
- `GET /all?year=2026` (admin)

### Holiday APIs (`/api/holidays`)
- `GET /?year=2026`
- `GET /check?date=2026-01-26`
- `POST /` (admin)
- `POST /seed` (admin)
- `PUT /:id` (admin)
- `DELETE /:id` (admin)

### Notification APIs (`/api/notifications`)
- `GET /?page=1&limit=20`
- `GET /unread-count`
- `PUT /:id/read`
- `PUT /mark-all-read`

### Admin APIs (`/api/admin`)
- `GET /stats`
- `GET /attendance-list?type=present|absent`
- `GET /employees`
- `GET /employees/:id`
- `GET /reports?type=daily&date=2026-03-15` or `GET /reports?type=monthly&date=2026-03-01`

---

## 7. Database Design

CBALMS uses Supabase PostgreSQL tables:

### `profiles`
- `id` (UUID, PK)
- `email`
- `full_name`
- `employee_id`
- `department`
- `mobile_number`
- `role` (`employee` / `admin`)
- `profile_photo`
- `present_status_of_employee`
- `created_at`, `updated_at`

### `attendance`
- `id` (UUID, PK)
- `employee_id` (FK -> profiles.id)
- `date`
- `check_in`
- `check_out`
- `status`
- `created_at`

### `leaves`
- `id` (UUID, PK)
- `employee_id` (FK)
- `leave_type` (`Sick`, `Casual`, `Earned`)
- `start_date`, `end_date`
- `reason`
- `status` (`Pending`, `Approved`, `Rejected`)
- `reviewed_by`, `reviewed_at`, `admin_remarks`
- `created_at`, `updated_at`

### `leave_balances`
- `id` (UUID, PK)
- `employee_id` (FK)
- `leave_type`
- `year`
- `total_days`, `used_days`, `remaining_days`
- `created_at`, `updated_at`

### `holidays`
- `id` (UUID, PK)
- `name`
- `date`
- `year`
- `type` (`public`, `bonus`)
- `created_at`, `updated_at`

### `notifications`
- `id` (UUID, PK)
- `user_id` (FK)
- `title`, `message`
- `type`
- `related_id`
- `is_read`
- `created_at`

---

## 8. Frontend Details

### Pages/Components
- Public: `LandingPage`, `Login`, `Signup`, `ForgotPassword`, `ResetPassword`
- Protected: `Dashboard`, `AdminDashboard`, `HolidayManagement`, `Profile`, `Notifications`
- Employee nested pages: `EmployeeDashboard`, `EmployeeLeaves`, `EmployeeAttendance`, `EmployeeHolidays`, `Settings`

### Routing
- Routing is configured in `frontend/src/App.js` using React Router.
- Protected routes are wrapped by `PrivateRoute`.
- `/employee-dashboard` uses nested routes via `EmployeeLayout` and `<Outlet />`.

### State Management
- **AuthContext**: user/session lifecycle and auth actions.
- **ThemeContext**: light/dark theme state.
- Local component state + custom hooks for page-level data handling.

---

## 9. Backend Details

### Architecture Pattern
- **Layered MVC-like API**:
  - `routes/` -> endpoint mapping
  - `controllers/` -> business rules and orchestration
  - `models/` -> Supabase queries

### Middleware
- `helmet()` for secure headers
- `cors()` for cross-origin policy
- `express-rate-limit` for abuse protection
- `requestId` middleware for correlation IDs
- Joi validation middleware for request payload checks
- centralized `errorHandler` middleware

### Authentication & Authorization
- JWT Bearer token validation through Supabase in `authenticateToken`.
- Role-based checks (`isAdmin`) protect admin endpoints.
- Authorization checks enforce owner/admin access to user-specific resources.

---

## 10. Features Explanation

### Attendance Management
- Employees check in/out daily.
- System prevents weekend/holiday check-ins and duplicate actions.
- Attendance history and current status are queryable.

### Leave Management
- Employees apply for leave with date ranges.
- Working days are calculated excluding weekends/holidays.
- Admins approve/reject; leave balances are updated accordingly.
- Approved/pending leaves can be cancelled with balance reconciliation.

### Holiday Management
- Admins can create, update, delete, and seed yearly holidays.
- Employees can view holidays and check if a date is marked as holiday.

### Notification System
- Event-driven notifications for leave lifecycle events.
- Read/unread tracking with single and bulk mark-as-read operations.

### Admin Monitoring
- Admin dashboard provides attendance and leave summary metrics.
- Attendance list, employee directory, and reports support HR operations.

---

## 11. Real-World Use Cases

- **SME HR Team**: Daily attendance tracking without spreadsheets.
- **Distributed Workforce**: Employees in multiple locations mark attendance via web app.
- **Audit & Compliance**: Report generation for monthly attendance/leave records.
- **Department Managers**: Fast leave approval with notification-driven workflow.

---

## 12. Performance Considerations

- Pagination (`page`, `limit`) on list-heavy endpoints.
- Bulk operations in selected model flows (for example, monthly leave accrual).
- Lean field selection in some admin/profile queries.
- Request size limits (10MB JSON/urlencoded) to reduce abuse and memory pressure.
- Cron jobs run off-request path to avoid blocking user traffic.

---

## 13. Security Considerations

- **Input Validation** with Joi schemas.
- **Authentication** with Supabase JWT verification.
- **Authorization (RBAC)** with admin-role checks.
- **Rate Limiting** for global and auth endpoints.
- **Secure HTTP Headers** via Helmet.
- **CORS Controls** with configurable allowed origins.
- **No sensitive secrets in frontend code** (use env variables).

Handled vulnerability classes include:
- Unauthorized access / privilege escalation (RBAC + ownership checks)
- Brute-force login attempts (auth limiter)
- Malformed input attacks (schema validation)
- Basic header-based hardening (Helmet)

---

## 14. Future Enhancements

- Complete and wire forgot/reset password API routes end-to-end.
- Add backend automated test suite (unit + integration).
- Implement audit logs for key admin actions.
- Add stronger session strategy (refresh token lifecycle hardening).
- Add export/report scheduling and email digests.
- Add Docker and CI quality gates for reproducible deployments.

---

## 15. Conclusion

CBALMS SDC 3.2 is a practical full-stack workforce management system designed for real organizational operations. With a React frontend, Express API, and Supabase backend, it offers a scalable foundation for attendance, leave, and admin workflows while balancing usability, maintainability, and security.
