const express = require('express');
const authController = require('../controllers/authController');
const { isLoggedIn } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/login', authController.login);
router.post('/register', authController.signup);   // SRS alias: POST /api/auth/register
router.post('/logout', authController.logout);
router.get('/me', isLoggedIn, authController.me);

module.exports = router;
