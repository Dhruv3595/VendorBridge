const express = require('express');
const purchaseOrdersController = require('../controllers/purchaseOrdersController');

const router = express.Router();

router.get('/', purchaseOrdersController.getPurchaseOrders);
router.get('/:id', purchaseOrdersController.getPurchaseOrderById);

module.exports = router;
