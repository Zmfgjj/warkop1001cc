const express = require('express');
const router = express.Router();
const pesananController = require('../controllers/pesananController');
const importController = require('../controllers/importController');
const auth = require('../middleware/auth');

router.post('/import', auth({ module: 'import_data', action: 'edit' }), importController.importPesananLama);
router.get('/', auth({ module: ['pos', 'kds'], action: 'view' }), pesananController.getPesanan);
router.post('/', auth({ module: ['pos', 'kds'], action: 'edit' }), pesananController.buatPesanan);
router.post('/reservasi', auth({ module: ['pos', 'kds'], action: 'edit' }), pesananController.buatReservasi);
router.put('/:id/status', auth({ module: ['pos', 'kds'], action: 'edit' }), pesananController.updateStatus);
router.put('/detail/:id/status', auth({ module: ['pos', 'kds'], action: 'edit' }), pesananController.updateStatusDetail);
router.put('/detail/:id/catatan', auth({ module: ['pos', 'kds'], action: 'edit' }), pesananController.updateDetailCatatan);
router.put('/:id/pembayaran', auth({ module: ['pos', 'kds'], action: 'edit' }), pesananController.konfirmasiPembayaran);
router.delete('/:id', auth({ module: 'laporan', action: 'edit' }), pesananController.hapusPesanan);

router.get('/debug/jeni', async (req, res) => {
  const db = require('../config/database');
  const [rows] = await db.query('SELECT * FROM pesanan WHERE nama_pelanggan LIKE "%jeni%" ORDER BY id DESC LIMIT 5');
  res.json(rows);
});

module.exports = router;