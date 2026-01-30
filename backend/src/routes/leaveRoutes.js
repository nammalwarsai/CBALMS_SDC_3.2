const express = require('express');
const router = express.Router();
const leaveController = require('../controllers/leaveController');
const { authenticateToken, isAdmin } = require('../middleware/authMiddleware');

// Employee routes (protected)
router.post('/apply', authenticateToken, leaveController.applyLeave);
router.get('/my-leaves', authenticateToken, leaveController.getMyLeaves);
router.delete('/cancel/:id', authenticateToken, leaveController.cancelLeave);

// Admin routes (protected + admin only)
router.get('/all', authenticateToken, isAdmin, leaveController.getAllLeaves);
router.get('/today', authenticateToken, isAdmin, leaveController.getTodayLeaves);
router.get('/:id', authenticateToken, leaveController.getLeaveDetails);
router.put('/:id/status', authenticateToken, isAdmin, leaveController.updateLeaveStatus);

module.exports = router;
