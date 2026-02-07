const express = require('express');
const router = express.Router();
const passwordController = require('../controllers/passwordController');
const { validate, forgotPasswordSchema, resetPasswordSchema } = require('../middleware/validate');

router.post('/forgot-password', validate(forgotPasswordSchema), passwordController.forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), passwordController.resetPassword);

module.exports = router;
