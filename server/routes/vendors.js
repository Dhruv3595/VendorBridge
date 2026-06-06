const express = require('express');
const vendorsController = require('../controllers/vendorsController');

const router = express.Router();

router.get('/', vendorsController.getVendors);
router.get('/:id', vendorsController.getVendorById);
router.post('/', vendorsController.createVendor);
router.put('/:id', vendorsController.updateVendor);
router.patch('/:id/status', vendorsController.updateVendorStatus);

module.exports = router;
