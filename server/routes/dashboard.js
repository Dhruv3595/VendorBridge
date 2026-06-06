const express = require('express');
const { getStats } = require('../controllers/dashboardController');
const { isLoggedIn } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/stats', isLoggedIn, getStats);

module.exports = router;
