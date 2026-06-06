const express = require('express');
const quotationsController = require('../controllers/quotationsController');
const { hasRole } = require('../middleware/authMiddleware');

const router = express.Router();

// Note: /rfq/:rfqId must come before /:id so Express doesn't treat "rfq" as an id
router.get('/', quotationsController.getQuotations);
router.get('/rfq/:rfqId', quotationsController.getQuotationsByRfq);
router.get('/:id', quotationsController.getQuotationById);
router.post('/', hasRole('Vendor'), quotationsController.createQuotation);
router.put('/:id', hasRole('Vendor'), quotationsController.updateQuotation);
router.patch('/:id/submit', hasRole('Vendor'), quotationsController.submitQuotation);
router.patch('/:id/withdraw', hasRole('Vendor'), quotationsController.withdrawQuotation);
router.patch('/:id/select', hasRole('Officer'), quotationsController.selectQuotation);

module.exports = router;
