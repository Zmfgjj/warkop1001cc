const express = require('express');
const router = express.Router();
const bonusController = require('../controllers/bonusController');
const { auth, requirePermission } = require('../middleware/auth');

router.get('/bulanan', auth, requirePermission('bonus_karyawan', 'view'), bonusController.getBonusBulanan);
router.put('/settings', auth, requirePermission('bonus_karyawan', 'edit'), bonusController.updateBonusPercent);

module.exports = router;
