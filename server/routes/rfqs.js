const express = require('express');
const rfqsController = require('../controllers/rfqsController');

const router = express.Router();

router.get('/', rfqsController.getRfqs);
router.get('/:id', rfqsController.getRfqById);
router.post('/', rfqsController.createRfq);
router.put('/:id', rfqsController.updateRfq);
router.patch('/:id/status', rfqsController.updateRfqStatus);

module.exports = router;
