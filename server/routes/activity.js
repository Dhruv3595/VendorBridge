const express = require('express');
const activityController = require('../controllers/activityController');
const { hasRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', hasRole('Admin', 'Officer', 'Vendor', 'Manager'), activityController.getActivity);

module.exports = router;
