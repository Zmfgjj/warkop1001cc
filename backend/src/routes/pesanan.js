const express = require('express');
const router = express.Router();
const pesananController = require('../controllers/pesananController');
const auth = require('../middleware/auth');

router.get('/', auth(['owner', 'manager', 'kasir', 'dapur']), pesananController.getPesanan);
router.post('/', auth(['kasir', 'owner']), pesananController.buatPesanan);
router.put('/:id/status', auth(['kasir', 'owner', 'dapur']), pesananController.updateStatus);
router.put('/detail/:id/status', auth(['dapur', 'kasir', 'owner']), pesananController.updateStatusDetail);

module.exports = router;