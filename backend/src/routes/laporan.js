const express = require('express');
const router = express.Router();
const laporanController = require('../controllers/laporanController');
const auth = require('../middleware/auth');

router.get('/ringkasan', auth({ module: 'laporan', action: 'view' }), laporanController.ringkasan);
router.get('/bulanan', auth({ module: 'laporan', action: 'view' }), laporanController.laporanBulanan);
router.get('/menu', auth({ module: 'laporan', action: 'view' }), laporanController.laporanMenu);
router.get('/histori', auth({ module: 'laporan', action: 'view' }), laporanController.historiPembelian);

module.exports = router;