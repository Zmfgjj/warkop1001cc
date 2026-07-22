const express = require('express');
const router = express.Router();
const pesananController = require('../controllers/pesananController');
const auth = require('../middleware/auth');

router.get('/', auth({ module: 'pos', action: 'view' }), pesananController.getPesanan);
router.post('/', auth({ module: 'pos', action: 'edit' }), pesananController.buatPesanan);
router.post('/reservasi', auth({ module: 'pos', action: 'edit' }), pesananController.buatReservasi);
router.put('/:id/status', auth({ module: 'pos', action: 'edit' }), pesananController.updateStatus);
router.put('/detail/:id/status', auth({ module: 'pos', action: 'edit' }), pesananController.updateStatusDetail);
router.put('/detail/:id/catatan', auth({ module: 'pos', action: 'edit' }), pesananController.updateDetailCatatan);
router.put('/:id/pembayaran', auth({ module: 'pos', action: 'edit' }), pesananController.konfirmasiPembayaran);
router.delete('/:id', auth({ module: 'laporan', action: 'edit' }), pesananController.hapusPesanan);

module.exports = router;