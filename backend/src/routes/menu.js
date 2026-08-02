const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/kategori', auth(), menuController.getKategori);
router.post('/kategori', auth({ module: 'manajemen_menu', action: 'edit' }), menuController.tambahKategori);
router.put('/kategori/:id', auth({ module: 'manajemen_menu', action: 'edit' }), menuController.updateKategori);
router.delete('/kategori/:id', auth({ module: 'manajemen_menu', action: 'edit' }), menuController.hapusKategori);

router.get('/', auth(), menuController.getMenu);
router.post('/', auth({ module: 'manajemen_menu', action: 'edit' }), upload.single('gambar'), menuController.tambahMenu);
router.put('/promo/bulk', auth({ module: 'manajemen_menu', action: 'edit' }), menuController.updateBulkPromo);
router.post('/promo/campaign', auth({ module: 'manajemen_promo', action: 'edit' }), menuController.createCampaignPromo);
router.get('/promo/campaign', auth({ module: 'manajemen_promo', action: 'view' }), menuController.getCampaignPromos);
router.delete('/promo/campaign/:id', auth({ module: 'manajemen_promo', action: 'edit' }), menuController.deleteCampaignPromo);
router.put('/:id', auth({ module: 'manajemen_menu', action: 'edit' }), upload.single('gambar'), menuController.updateMenu);
router.delete('/:id', auth({ module: 'manajemen_menu', action: 'edit' }), menuController.hapusMenu);

module.exports = router;