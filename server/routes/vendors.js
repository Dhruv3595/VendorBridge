const express = require('express');
const vendorsController = require('../controllers/vendorsController');
const { hasRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', hasRole('Admin', 'Officer'), vendorsController.getVendors);
router.get('/:id', hasRole('Admin', 'Officer'), vendorsController.getVendorById);
router.post('/', hasRole('Admin', 'Officer'), vendorsController.createVendor);
router.patch('/:id', hasRole('Admin', 'Officer'), vendorsController.updateVendor);
router.patch('/:id/status', hasRole('Admin', 'Officer'), vendorsController.updateVendorStatus);

module.exports = router;
