const express = require('express');
const purchaseOrdersController = require('../controllers/purchaseOrdersController');
const { hasRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', hasRole('Admin', 'Officer', 'Vendor'), purchaseOrdersController.getPurchaseOrders);
router.post('/', hasRole('Admin', 'Officer'), purchaseOrdersController.createPurchaseOrder);
router.get('/:id/pdf', hasRole('Admin', 'Officer', 'Vendor'), purchaseOrdersController.getPoPdf);
router.post('/:id/email', hasRole('Admin', 'Officer'), purchaseOrdersController.emailPo);
router.patch('/:id/status', hasRole('Admin', 'Officer'), purchaseOrdersController.updatePoStatus);
router.get('/:id', hasRole('Admin', 'Officer', 'Vendor'), purchaseOrdersController.getPurchaseOrderById);

module.exports = router;
