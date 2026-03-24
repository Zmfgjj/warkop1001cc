const express = require('express');
const router = express.Router();
const pembayaranController = require('../controllers/pembayaranController');
const auth = require('../middleware/auth');

router.get('/', auth(['owner', 'manager', 'kasir']), pembayaranController.getPembayaran);
router.post('/', auth(['kasir', 'owner']), pembayaranController.buatPembayaran);
router.put('/:id/konfirmasi', auth(['kasir', 'owner']), pembayaranController.konfirmasiQris);

module.exports = router;