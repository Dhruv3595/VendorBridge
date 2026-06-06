const express = require('express');
const reportsController = require('../controllers/reportsController');
const { hasRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/stats', hasRole('Admin', 'Officer'), reportsController.getStats);
router.get('/summary', hasRole('Admin', 'Officer'), reportsController.getStats);
router.get('/monthly-spend', hasRole('Admin', 'Officer'), reportsController.getMonthlySpend);
router.get('/monthly-trend', hasRole('Admin', 'Officer'), reportsController.getMonthlySpend);
router.get('/spend-by-category', hasRole('Admin', 'Officer'), reportsController.getSpendByCategory);
router.get('/top-vendors', hasRole('Admin', 'Officer'), reportsController.getTopVendors);
router.get('/export', hasRole('Admin', 'Officer'), reportsController.exportPurchaseOrders);

module.exports = router;
