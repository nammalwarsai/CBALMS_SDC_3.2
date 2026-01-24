const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

router.get('/employees', adminController.getAllEmployees);
router.get('/employees/:id', adminController.getEmployeeDetails);
router.get('/reports', adminController.getAttendanceReport);

module.exports = router;
