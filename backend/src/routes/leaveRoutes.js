const express = require('express');
const router = express.Router();
const leaveController = require('../controllers/leaveController');
const { authenticateToken, isAdmin } = require('../middleware/authMiddleware');
const { validate, leaveSchema, leaveStatusSchema } = require('../middleware/validate');

// Employee routes (protected)
router.post('/apply', authenticateToken, validate(leaveSchema), leaveController.applyLeave);
router.get('/my-leaves', authenticateToken, leaveController.getMyLeaves);
router.delete('/cancel/:id', authenticateToken, leaveController.cancelLeave);

// Admin routes (protected + admin only)
router.get('/all', authenticateToken, isAdmin, leaveController.getAllLeaves);
router.get('/today', authenticateToken, isAdmin, leaveController.getTodayLeaves);
router.get('/:id', authenticateToken, leaveController.getLeaveDetails);
router.put('/:id/status', authenticateToken, isAdmin, validate(leaveStatusSchema), leaveController.updateLeaveStatus);

module.exports = router;
