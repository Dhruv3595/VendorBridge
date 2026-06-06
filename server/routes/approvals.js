const express = require('express');
const approvalsController = require('../controllers/approvalsController');
const { hasRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', hasRole('Admin', 'Officer', 'Manager'), approvalsController.getApprovals);
router.get('/:id', hasRole('Admin', 'Officer', 'Manager'), approvalsController.getApprovalById);
router.post('/', hasRole('Officer'), approvalsController.createApproval);
router.patch('/:id/approve', hasRole('Manager'), approvalsController.approveApproval);
router.patch('/:id/reject', hasRole('Manager'), approvalsController.rejectApproval);

module.exports = router;
