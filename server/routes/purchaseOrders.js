const express = require('express');
const purchaseOrdersController = require('../controllers/purchaseOrdersController');
const { hasRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', hasRole('Admin', 'Officer', 'Vendor'), purchaseOrdersController.getPurchaseOrders);
router.get('/:id', hasRole('Admin', 'Officer', 'Vendor'), purchaseOrdersController.getPurchaseOrderById);

module.exports = router;
