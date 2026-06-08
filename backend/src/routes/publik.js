const express = require('express');
const router = express.Router();
const publikController = require('../controllers/publikController');
const upload = require('../middleware/upload');

// All public routes — NO auth middleware
// Security handled inside controller (rate limiting, input validation, parameterized queries)
router.get('/menu', publikController.getMenuPublik);
router.get('/kategori', publikController.getKategoriPublik);
router.get('/meja/:nomor', publikController.getMejaPublik);
router.get('/ppn', publikController.getPPNPublik);
router.post('/pesanan', upload.single('bukti_pembayaran'), publikController.buatPesananPublik);
router.post('/pesanan/:id/bukti', upload.single('bukti_pembayaran'), publikController.uploadBukti);

module.exports = router;
