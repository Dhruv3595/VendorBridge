const express = require('express');
const rfqsController = require('../controllers/rfqsController');
const { hasRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', rfqsController.getRfqs);
router.get('/:id', rfqsController.getRfqById);
router.post('/', hasRole('Officer'), rfqsController.createRfq);
router.put('/:id', hasRole('Officer'), rfqsController.updateRfq);
router.patch('/:id/status', hasRole('Officer'), rfqsController.updateRfqStatus);
router.post('/:id/publish', hasRole('Officer'), rfqsController.publishRfq);
router.post('/:id/assign-vendors', hasRole('Officer'), rfqsController.assignVendors);

module.exports = router;
