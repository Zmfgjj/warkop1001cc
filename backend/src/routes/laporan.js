const express = require('express');
const router = express.Router();
const laporanController = require('../controllers/laporanController');
const auth = require('../middleware/auth');

router.get('/ringkasan', auth(['owner', 'manager']), laporanController.ringkasan);
router.get('/bulanan', auth(['owner', 'manager']), laporanController.laporanBulanan);
router.get('/menu', auth(['owner', 'manager']), laporanController.laporanMenu);

module.exports = router;