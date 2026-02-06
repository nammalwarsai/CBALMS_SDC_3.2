const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, isAdmin } = require('../middleware/authMiddleware');

// All admin routes require auth + admin role
router.get('/stats', authenticateToken, isAdmin, adminController.getDashboardStats);
router.get('/attendance-list', authenticateToken, isAdmin, adminController.getAttendanceList);
router.get('/employees', authenticateToken, isAdmin, adminController.getAllEmployees);
router.get('/employees/:id', authenticateToken, isAdmin, adminController.getEmployeeDetails);
router.get('/reports', authenticateToken, isAdmin, adminController.getAttendanceReport);

module.exports = router;
