const express = require('express');
const router = express.Router();
const holidayController = require('../controllers/holidayController');
const { authenticateToken, isAdmin } = require('../middleware/authMiddleware');

// Public route - get holidays (any authenticated user can view)
router.get('/', authenticateToken, holidayController.getHolidays);

// Public route - check if a date is a holiday
router.get('/check', authenticateToken, holidayController.checkDate);

// Admin routes
router.post('/', authenticateToken, isAdmin, holidayController.createHoliday);
router.post('/seed', authenticateToken, isAdmin, holidayController.seedHolidays);
router.put('/:id', authenticateToken, isAdmin, holidayController.updateHoliday);
router.delete('/:id', authenticateToken, isAdmin, holidayController.deleteHoliday);

module.exports = router;
