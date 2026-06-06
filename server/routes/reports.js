const express = require('express');
const reportsController = require('../controllers/reportsController');

const router = express.Router();

router.get('/stats', reportsController.getStats);
router.get('/monthly-spend', reportsController.getMonthlySpend);
router.get('/top-vendors', reportsController.getTopVendors);
router.get('/export', reportsController.exportPurchaseOrders);

module.exports = router;
