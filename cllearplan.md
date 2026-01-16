# Clear Cut Plan: Supabase Integration (MVC Pattern)

This file details the steps to connect your React Frontend and Express Backend with Supabase for authentication and data storage.

## 1. Goal
Connect Frontend -> Backend -> Supabase.
- **Frontend**: Sends signup/login requests to Backend.
- **Backend (MVC)**:
  - **Controller**: Validates requests.
  - **Model**: Uses Supabase Client to authenticate/store data.
- **Database**: Supabase manages `auth.users` and a `test_schema.profiles` (or public) table.

## 2. Prerequisites
You must have a Supabase Project.
- **URL**: `SUPABASE_URL`
- **Key**: `SUPABASE_SERVICE_ROLE_KEY` (Keep this secret! Backend only).

## 3. Necessary Changes and Files

### 3.1 Backend Changes
**Location**: `backend/`

1.  **Dependencies**: Install `dotenv`, `cors`, `@supabase/supabase-js`.
2.  **Environment Variables (`.env`)**:
    ```
    PORT=5000
    SUPABASE_URL=your_supabase_url
    SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
    FRONTEND_URL=http://localhost:3000
    ```
3.  **New File Structure**:
    - `src/config/supabaseClient.js`: Initialize Supabase.
    - `src/routes/authRoutes.js`: Define `/signup`, `/login`, `/me`.
    - `src/controllers/authController.js`: Logic for auth.
    - `src/models/authModel.js`: Interact with Supabase.
    - `src/middleware/authMiddleware.js`: Protect routes.

4.  **Update `server.js`**:
    - Use `authRoutes`.
    - Configure CORS.

### 3.2 Frontend Changes
**Location**: `frontend/`

1.  **Environment Variables (`.env`)**:
    ```
    REACT_APP_API_URL=http://localhost:5000/api
    ```
2.  **Service Layer**:
    - Update `src/services/api.js`: Point to `REACT_APP_API_URL`.
    - Update `src/services/authService.js`: Remove mocks, call backend endpoints.
3.  **Context**:
    - Update `src/context/AuthContext.js`: Use `authService` for real calls.
4.  **UI**:
    - `src/pages/Login.js`: Handle form submit -> `login`.
    - `src/pages/Signup.js`: Handle form submit -> `register`.

## 4. Implementation Steps
1.  **Setup Supabase**: Create project and `profiles` table.
2.  **Backend Setup**: Install deps, create `.env`, setup MVC folders.
3.  **Backend Logic**: Write Controller/Model/Routes for Auth.
4.  **Frontend Setup**: Create `.env`, update `api.js`.
5.  **Frontend Logic**: Connect `authService` to Backend.
6.  **Verify**: Test Signup and Login flow.
