const express = require('express');
const router = express.Router();
const bonusController = require('../controllers/bonusController');
const auth = require('../middleware/auth');

router.get('/bulanan', auth({ module: 'bonus_karyawan', action: 'view' }), bonusController.getBonusBulanan);
router.put('/settings', auth({ module: 'bonus_karyawan', action: 'edit' }), bonusController.updateBonusPercent);

module.exports = router;
