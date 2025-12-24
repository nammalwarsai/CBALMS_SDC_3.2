# Cloud Based Attendance & Leave Management System - Project Plan

## 1. Project Overview
A web-based application to manage employee attendance and leave requests.
**Tech Stack:** MERN (MongoDB, Express.js, React.js, Node.js)
**DevOps:** Docker, Terraform, AWS (EC2, S3), GitHub Actions, Nginx.

## 2. Architecture
- **Frontend:** React.js application served via Nginx or static hosting, communicating with Backend API.
- **Backend:** Node.js/Express.js REST API.
- **Database:** MongoDB (Atlas or self-hosted on EC2).
- **Storage:** AWS S3 for user profile photos.
- **Hosting:** AWS EC2 instance running Docker containers for Frontend (Nginx) and Backend.
- **CI/CD:** GitHub Actions to build Docker images and deploy to EC2.
- **Infrastructure:** Terraform to provision AWS EC2, S3, and Security Groups.

## 3. Database Schema (MongoDB)

### Users Collection
- `_id`: ObjectId
- `name`: String
- `email`: String (Unique)
- `password`: String (Hashed)
- `role`: String ('admin', 'employee')
- `profilePhotoUrl`: String (S3 URL)
- `department`: String
- `designation`: String
- `createdAt`: Date

### Attendance Collection
- `_id`: ObjectId
- `userId`: ObjectId (Ref: Users)
- `date`: Date
- `checkInTime`: Date
- `checkOutTime`: Date
- `status`: String ('Present', 'Absent', 'Late')
- `location`: String (Optional - IP or Geo)

### Leaves Collection
- `_id`: ObjectId
- `userId`: ObjectId (Ref: Users)
- `leaveType`: String ('Sick', 'Casual', 'Earned')
- `startDate`: Date
- `endDate`: Date
- `reason`: String
- `status`: String ('Pending', 'Approved', 'Rejected')
- `appliedAt`: Date
- `adminComment`: String

## 4. Frontend Modules (React)
- **Authentication:** Login, Register (Admin only?), Forgot Password.
- **Layout:** Sidebar/Navbar, Protected Routes.
- **Dashboard:** Summary of attendance, leave balance, recent activities.
- **Attendance:** Mark Check-in/Check-out, View Attendance History.
- **Leaves:** Apply for Leave, View Leave Status, Leave Balance.
- **Profile:** View/Edit Profile, Upload Photo (S3).
- **Admin Section:**
    - Manage Employees (Add/Edit/Delete).
    - View All Attendance.
    - Manage Leave Requests (Approve/Reject).

## 5. Backend Modules (Node/Express)
- **Auth Routes:** Login, Register, JWT Token generation.
- **User Routes:** CRUD Users, Upload Photo (Multer + AWS SDK).
- **Attendance Routes:** Check-in, Check-out, Get History.
- **Leave Routes:** Apply, Approve/Reject, Get Leaves.
- **Middleware:** AuthMiddleware (Verify JWT), RoleMiddleware (Admin check).

## 6. DevOps & Infrastructure

### Docker
- `Dockerfile` for Backend.
- `Dockerfile` for Frontend (Multi-stage build: Node build -> Nginx serve).
- `docker-compose.yml` for local development and orchestration.

### Terraform (Infrastructure as Code)
- Provider: AWS
- Resources:
    - `aws_instance` (EC2)
    - `aws_s3_bucket` (Profile Photos)
    - `aws_security_group` (Allow ports 80, 443, 22)
    - `aws_key_pair` (SSH Access)

### GitHub Actions (CI/CD)
- **Build Workflow:** On push to main, build Docker images.
- **Deploy Workflow:** Push images to Docker Hub/ECR, SSH into EC2, pull new images, restart containers.

### AWS S3
- Bucket for storing images.
- IAM User/Role with access to the bucket.

### Nginx
- Reverse Proxy configuration to route traffic to Backend API and serve Frontend static files.
