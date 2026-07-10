const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');

router.get('/', auth({ module: 'user_manage', action: 'view' }), userController.getUsers);
router.post('/', auth({ module: 'user_manage', action: 'edit' }), userController.tambahUser);
router.put('/ganti-password', auth([]), userController.gantiPassword);
router.put('/:id', auth({ module: 'user_manage', action: 'edit' }), userController.updateUser);
router.delete('/:id', auth({ module: 'user_manage', action: 'edit' }), userController.hapusUser);
router.post('/:id/reset-session', auth({ module: 'user_manage', action: 'edit' }), userController.resetSession);

module.exports = router;