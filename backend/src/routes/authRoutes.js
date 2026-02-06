const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const { validate, signupSchema, loginSchema, updateProfileSchema } = require('../middleware/validate');

router.post('/signup', validate(signupSchema), authController.signup);
router.post('/login', validate(loginSchema), authController.login);
router.get('/me', authMiddleware, authController.getMe);
router.put('/update-profile', authMiddleware, validate(updateProfileSchema), authController.updateProfile);

module.exports = router;
