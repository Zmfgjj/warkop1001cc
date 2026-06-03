const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');

router.get('/', auth(['owner', 'manager', 'admin']), userController.getUsers);
router.post('/', auth(['owner', 'manager', 'admin']), userController.tambahUser);
router.put('/ganti-password', auth(['owner', 'manager', 'admin', 'kasir', 'dapur']), userController.gantiPassword);
router.put('/:id', auth(['owner', 'manager', 'admin']), userController.updateUser);
router.delete('/:id', auth(['owner', 'manager', 'admin']), userController.hapusUser);

module.exports = router;