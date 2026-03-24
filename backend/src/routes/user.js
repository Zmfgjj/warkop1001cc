const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');

router.get('/', auth(['owner', 'manager']), userController.getUsers);
router.post('/', auth(['owner']), userController.tambahUser);
router.put('/:id', auth(['owner']), userController.updateUser);
router.delete('/:id', auth(['owner']), userController.hapusUser);
router.put('/ganti-password', auth(['owner', 'manager', 'kasir', 'dapur']), userController.gantiPassword);

module.exports = router;