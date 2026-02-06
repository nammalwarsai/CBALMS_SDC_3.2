const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { authenticateToken } = require('../middleware/authMiddleware');

// All attendance routes now require authentication (security fix)
router.post('/check-in', authenticateToken, attendanceController.checkIn);
router.post('/check-out', authenticateToken, attendanceController.checkOut);
router.get('/history/:userId', authenticateToken, attendanceController.getHistory);
router.get('/status/:userId', authenticateToken, attendanceController.getStatus);

module.exports = router;
