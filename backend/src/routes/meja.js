const express = require('express');
const router = express.Router();
const mejaController = require('../controllers/mejaController');
const auth = require('../middleware/auth');

router.get('/', auth([]), mejaController.getMeja);
router.post('/', auth({ module: 'manajemen_meja', action: 'edit' }), mejaController.tambahMeja);
router.put('/:id/qr', auth({ module: 'manajemen_meja', action: 'edit' }), mejaController.generateQR);
router.put('/:id/status', auth({ module: 'pos', action: 'edit' }), mejaController.updateStatusMeja);
router.delete('/:id', auth({ module: 'manajemen_meja', action: 'edit' }), mejaController.hapusMeja);

module.exports = router;