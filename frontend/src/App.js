import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import AppErrorBoundary from './components/common/ErrorBoundary';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import EmployeeLeaves from './pages/EmployeeLeaves';
import EmployeeAttendance from './pages/EmployeeAttendance';
import EmployeeHolidays from './pages/EmployeeHolidays';
import Settings from './pages/Settings';
import EmployeeLayout from './components/layout/EmployeeLayout';
import AdminDashboard from './pages/AdminDashboard';
import HolidayManagement from './pages/HolidayManagement';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import PrivateRoute from './components/PrivateRoute';
import LandingPage from './pages/LandingPage';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import './styles/designSystem.css';

function App() {
  return (
    <AppErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <Router>
            <div className="page-transition">
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route
                  path="/dashboard"
                  element={
                    <PrivateRoute>
                      <Dashboard />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/employee-dashboard"
                  element={
                    <PrivateRoute>
                      <EmployeeLayout />
                    </PrivateRoute>
                  }
                >
                  <Route index element={<EmployeeDashboard />} />
                  <Route path="leaves" element={<EmployeeLeaves />} />
                  <Route path="attendance" element={<EmployeeAttendance />} />
                  <Route path="holidays" element={<EmployeeHolidays />} />
                  <Route path="settings" element={<Settings />} />
                </Route>
                <Route
                  path="/admin-dashboard"
                  element={
                    <PrivateRoute>
                      <AdminDashboard />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/holidays"
                  element={
                    <PrivateRoute>
                      <HolidayManagement />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <PrivateRoute>
                      <Profile />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/notifications"
                  element={
                    <PrivateRoute>
                      <Notifications />
                    </PrivateRoute>
                  }
                />
              </Routes>
            </div>
            <ToastContainer
              position="top-right"
              autoClose={3000}
              hideProgressBar={false}
              newestOnTop
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="colored"
            />
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </AppErrorBoundary>
  );
}

export default App;
