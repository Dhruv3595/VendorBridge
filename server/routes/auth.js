const express = require('express');
const authController = require('../controllers/authController');
const { isLoggedIn } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/login', authController.login);
router.post('/register', authController.signup);
router.post('/logout', authController.logout);
router.get('/me', isLoggedIn, authController.me);
router.post('/forgot-password', authController.forgotPassword);
router.post('/verify-otp', authController.verifyOtp);
router.post('/reset-password', authController.resetPassword);

module.exports = router;
