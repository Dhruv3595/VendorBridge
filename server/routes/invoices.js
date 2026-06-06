const express = require('express');
const invoicesController = require('../controllers/invoicesController');

const router = express.Router();

router.get('/', invoicesController.getInvoices);
router.post('/', invoicesController.createInvoice);
router.get('/:id/pdf', invoicesController.getInvoicePdf);
router.post('/:id/email', invoicesController.emailInvoice);
router.patch('/:id/mark-paid', invoicesController.markInvoicePaid);
router.get('/:id', invoicesController.getInvoiceById);

module.exports = router;
