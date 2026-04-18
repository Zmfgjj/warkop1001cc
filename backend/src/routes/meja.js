const express = require('express');
const router = express.Router();
const mejaController = require('../controllers/mejaController');
const auth = require('../middleware/auth');

router.get('/', auth(['owner', 'manager', 'kasir', 'admin']), mejaController.getMeja);
router.post('/', auth(['owner', 'manager']), mejaController.tambahMeja);
router.put('/:id/qr', auth(['owner', 'manager']), mejaController.generateQR);
router.put('/:id/status', auth(['owner', 'manager', 'kasir']), mejaController.updateStatusMeja);
router.delete('/:id', auth(['owner', 'manager']), mejaController.hapusMeja);

module.exports = router;