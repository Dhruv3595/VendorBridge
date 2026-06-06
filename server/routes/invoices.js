const express = require('express');
const invoicesController = require('../controllers/invoicesController');
const { hasRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', hasRole('Admin', 'Officer', 'Vendor'), invoicesController.getInvoices);
router.post('/', hasRole('Officer'), invoicesController.createInvoice);
router.get('/:id/pdf', hasRole('Admin', 'Officer', 'Vendor'), invoicesController.getInvoicePdf);
router.post('/:id/email', hasRole('Officer'), invoicesController.emailInvoice);
router.patch('/:id/mark-paid', hasRole('Officer'), invoicesController.markInvoicePaid);
router.get('/:id', hasRole('Admin', 'Officer', 'Vendor'), invoicesController.getInvoiceById);

module.exports = router;
