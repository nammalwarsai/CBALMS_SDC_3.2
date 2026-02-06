const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticateToken } = require('../middleware/authMiddleware');

// All routes require authentication
router.get('/', authenticateToken, notificationController.getNotifications);
router.get('/unread-count', authenticateToken, notificationController.getUnreadCount);
router.put('/:id/read', authenticateToken, notificationController.markAsRead);
router.put('/mark-all-read', authenticateToken, notificationController.markAllAsRead);

module.exports = router;
