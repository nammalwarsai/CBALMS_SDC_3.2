const express = require('express');
const router = express.Router();
const leaveBalanceController = require('../controllers/leaveBalanceController');
const { authenticateToken, isAdmin } = require('../middleware/authMiddleware');

// Employee: get my balances
router.get('/my-balances', authenticateToken, leaveBalanceController.getMyBalances);

// Admin: get all employee balances
router.get('/all', authenticateToken, isAdmin, leaveBalanceController.getAllBalances);

module.exports = router;
