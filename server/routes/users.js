const express = require('express');
const usersController = require('../controllers/usersController');
const { hasRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', hasRole('Admin'), usersController.getUsers);
router.post('/', hasRole('Admin'), usersController.createUser);
router.patch('/:id/status', hasRole('Admin'), usersController.updateUserStatus);

module.exports = router;
