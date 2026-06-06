const express = require('express');
const approvalsController = require('../controllers/approvalsController');

const router = express.Router();

router.get('/', approvalsController.getApprovals);
router.get('/:id', approvalsController.getApprovalById);
router.post('/', approvalsController.createApproval);
router.patch('/:id/approve', approvalsController.approveApproval);
router.patch('/:id/reject', approvalsController.rejectApproval);

module.exports = router;
