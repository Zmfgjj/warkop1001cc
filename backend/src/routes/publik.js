const express = require('express');
const router = express.Router();
const publikController = require('../controllers/publikController');

// All public routes — NO auth middleware
// Security handled inside controller (rate limiting, input validation, parameterized queries)
router.get('/menu', publikController.getMenuPublik);
router.get('/kategori', publikController.getKategoriPublik);
router.get('/meja/:nomor', publikController.getMejaPublik);
router.get('/ppn', publikController.getPPNPublik);
router.post('/pesanan', publikController.buatPesananPublik);

module.exports = router;
