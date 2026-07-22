const express = require('express');
const router = express.Router();
const pembayaranController = require('../controllers/pembayaranController');
const auth = require('../middleware/auth');

router.get('/', auth({ module: 'pos', action: 'view' }), pembayaranController.getPembayaran);
router.post('/', auth({ module: 'pos', action: 'edit' }), pembayaranController.buatPembayaran);
router.put('/:id/konfirmasi', auth({ module: 'pos', action: 'edit' }), pembayaranController.konfirmasiQris);

module.exports = router;