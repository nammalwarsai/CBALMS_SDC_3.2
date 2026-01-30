# Leave Management System

## Overview

The Leave Management System is a comprehensive feature that allows employees to apply for leaves and enables administrators to review, approve, or reject leave requests. This document outlines the complete implementation details for presentation purposes.

---

## Features

### For Employees
- ✅ Apply for different types of leaves (Sick, Casual, Earned)
- ✅ Specify leave duration with start and end dates
- ✅ Provide reason for leave request
- ✅ View personal leave history with status
- ✅ Cancel pending leave requests
- ✅ See admin remarks on processed requests

### For Administrators
- ✅ View all leave requests with filters (Pending/Approved/Rejected/All)
- ✅ See pending leave count badge on dashboard
- ✅ Approve or reject leave requests with optional remarks
- ✅ View employees currently on leave (Today's Leaves)
- ✅ Dashboard stats show real-time "On Leave" count
- ✅ Click "On Leave" card to see list of employees on leave today

---

## Database Schema

### Leaves Table

```sql
CREATE TABLE leaves (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  employee_id uuid REFERENCES profiles(id) NOT NULL,
  leave_type text NOT NULL,        -- 'Sick', 'Casual', 'Earned'
  start_date date NOT NULL,
  end_date date NOT NULL,
  reason text,
  status text DEFAULT 'Pending',   -- 'Pending', 'Approved', 'Rejected'
  admin_remarks text,
  reviewed_by uuid REFERENCES profiles(id),
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

### Row Level Security (RLS) Policies

```sql
-- Enable RLS
ALTER TABLE leaves ENABLE ROW LEVEL SECURITY;

-- Employees can view their own leaves
CREATE POLICY "Users can view own leaves" ON leaves
  FOR SELECT USING (auth.uid() = employee_id);

-- Employees can insert their own leaves
CREATE POLICY "Users can insert own leaves" ON leaves
  FOR INSERT WITH CHECK (auth.uid() = employee_id);

-- Admins can view all leaves
CREATE POLICY "Admin can view all leaves" ON leaves
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- Admins can update all leaves (approve/reject)
CREATE POLICY "Admin can update all leaves" ON leaves
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );
```

---

## API Endpoints

### Employee Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/leaves/apply` | Submit a new leave request | ✅ Employee |
| GET | `/api/leaves/my-leaves` | Get employee's leave history | ✅ Employee |
| DELETE | `/api/leaves/cancel/:id` | Cancel a pending leave request | ✅ Employee |

### Admin Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/leaves/all` | Get all leave requests (with optional status filter) | ✅ Admin |
| GET | `/api/leaves/today` | Get employees on leave today | ✅ Admin |
| GET | `/api/leaves/:id` | Get leave details by ID | ✅ Employee/Admin |
| PUT | `/api/leaves/:id/status` | Approve or reject a leave | ✅ Admin |

---

## Backend Architecture

### Files Structure

```
backend/
├── src/
│   ├── models/
│   │   └── leaveModel.js         # Database operations for leaves
│   ├── controllers/
│   │   └── leaveController.js    # API request handlers
│   ├── routes/
│   │   └── leaveRoutes.js        # Route definitions
│   └── middleware/
│       └── authMiddleware.js     # Authentication & admin check
└── server.js                     # Leave routes registered
```

### Leave Model Functions

| Function | Description |
|----------|-------------|
| `createLeave()` | Insert new leave request |
| `getLeavesByEmployee()` | Get all leaves for an employee |
| `getAllLeaves()` | Get all leaves with employee profiles |
| `getPendingLeaves()` | Get only pending leave requests |
| `getTodayLeaves()` | Get approved leaves active today |
| `updateLeaveStatus()` | Update leave status (approve/reject) |
| `getLeaveById()` | Get single leave details |
| `getApprovedLeavesCountForDate()` | Count employees on leave for a date |
| `deleteLeave()` | Cancel/delete a pending leave |

---

## Frontend Architecture

### Files Structure

```
frontend/
├── src/
│   ├── services/
│   │   └── leaveService.js       # API calls for leave operations
│   └── pages/
│       ├── EmployeeDashboard.js  # Leave application form & history
│       └── AdminDashboard.js     # Leave management modals
```

### Leave Service Functions

```javascript
leaveService = {
  applyLeave(leaveData)        // Submit leave application
  getMyLeaves()                // Get employee's leave history
  cancelLeave(leaveId)         // Cancel pending leave
  getAllLeaves(status)         // Admin: Get leaves with filter
  getTodayLeaves()             // Admin: Get today's leaves
  approveLeave(leaveId, remarks)  // Admin: Approve leave
  rejectLeave(leaveId, remarks)   // Admin: Reject leave
  getLeaveDetails(leaveId)     // Get leave by ID
}
```

---

## User Interface

### Employee Dashboard

#### Leave Application Form
- **Leave Type**: Dropdown (Sick Leave, Casual Leave, Earned Leave)
- **Start Date**: Date picker (required)
- **End Date**: Date picker (required, must be ≥ start date)
- **Reason**: Text area (required)
- **Submit Button**: With loading state

#### Leave History Table
| Column | Description |
|--------|-------------|
| Type | Leave type (Sick/Casual/Earned) |
| Start Date | Leave start date |
| End Date | Leave end date |
| Status | Badge (Pending/Approved/Rejected) |
| Action | Cancel button (for pending) or Admin remarks |

### Admin Dashboard

#### New Buttons Added
1. **📅 Today's Leaves (count)** - Shows employees currently on leave
2. **📋 Leave Requests (badge)** - Opens leave management modal with pending count

#### On Leave Stat Card
- Now clickable to show today's leaves modal
- Displays real-time count from database

#### Leave Management Modal
- **Filter Buttons**: Pending | Approved | Rejected | All
- **Table Columns**: Employee, Department, Type, Start Date, End Date, Reason, Status, Actions
- **Actions**: Approve ✓ | Reject ✗ | Remarks input field

#### Today's Leaves Modal
- Shows all employees on approved leave for current date
- Displays employee info, leave type, and leave period

---

## Workflow

### Employee Leave Application Flow

```
┌─────────────────┐
│  Employee fills │
│  leave form     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Validates form │
│  (dates, fields)│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  POST /api/     │
│  leaves/apply   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Leave created  │
│  Status: Pending│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Employee sees  │
│  in Leave History│
└─────────────────┘
```

### Admin Approval Flow

```
┌─────────────────┐
│  Admin clicks   │
│  Leave Requests │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Modal shows    │
│  pending leaves │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Admin reviews  │
│  leave details  │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌───────┐ ┌───────┐
│Approve│ │Reject │
└───┬───┘ └───┬───┘
    │         │
    ▼         ▼
┌─────────────────┐
│  Status updated │
│  + Admin remarks│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Employee sees  │
│  updated status │
└─────────────────┘
```

---

## Leave Types

| Type | Description | Typical Usage |
|------|-------------|---------------|
| **Sick Leave** | For health-related absences | Illness, medical appointments |
| **Casual Leave** | For personal matters | Personal errands, short breaks |
| **Earned Leave** | Accumulated leave balance | Vacations, planned time off |

---

## Status Definitions

| Status | Color | Description |
|--------|-------|-------------|
| **Pending** | 🟡 Yellow | Awaiting admin review |
| **Approved** | 🟢 Green | Leave request accepted |
| **Rejected** | 🔴 Red | Leave request denied |

---

## Security Features

1. **Authentication Required**: All endpoints require valid JWT token
2. **Role-Based Access**: Admin endpoints check for admin role
3. **Row Level Security**: Database-level protection for leave records
4. **Own Data Access**: Employees can only view/modify their own leaves
5. **Pending Only Cancellation**: Employees cannot cancel approved/rejected leaves

---

## Integration Points

### Dashboard Stats
- Admin dashboard "On Leave" count pulls from leaves table
- Absent count calculation: `Total - Present - On Leave`

### Real-time Updates
- Leave history refreshes after submission
- Admin modal updates after approve/reject
- Dashboard stats refresh on page load

---

## Sample API Requests

### Apply for Leave
```javascript
POST /api/leaves/apply
Headers: { Authorization: "Bearer <token>" }
Body: {
  "leaveType": "Sick",
  "startDate": "2026-02-01",
  "endDate": "2026-02-03",
  "reason": "Medical appointment and recovery"
}
```

### Approve Leave (Admin)
```javascript
PUT /api/leaves/:id/status
Headers: { Authorization: "Bearer <token>" }
Body: {
  "status": "Approved",
  "remarks": "Approved. Get well soon!"
}
```

---

## Future Enhancements

- [ ] Leave balance tracking per employee
- [ ] Email notifications on status change
- [ ] Leave calendar view
- [ ] Half-day leave option
- [ ] Leave approval workflow (multiple approvers)
- [ ] Leave reports and analytics
- [ ] Bulk leave approval for admins

---

## Conclusion

The Leave Management System provides a complete end-to-end solution for managing employee leaves. It seamlessly integrates with the existing attendance system, provides role-based access control, and offers an intuitive user interface for both employees and administrators.

**Key Highlights:**
- 🎯 Simple and intuitive UI
- 🔒 Secure with RLS and authentication
- 📊 Real-time dashboard integration
- 📝 Complete audit trail with timestamps
- ✨ Responsive design for all devices