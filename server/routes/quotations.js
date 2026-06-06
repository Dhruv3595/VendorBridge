const express = require('express');
const quotationsController = require('../controllers/quotationsController');

const router = express.Router();

// Note: /rfq/:rfqId must come before /:id so Express doesn't treat "rfq" as an id
router.get('/rfq/:rfqId', quotationsController.getQuotationsByRfq);
router.get('/:id', quotationsController.getQuotationById);
router.post('/', quotationsController.createQuotation);
router.put('/:id', quotationsController.updateQuotation);
router.patch('/:id/submit', quotationsController.submitQuotation);

module.exports = router;
