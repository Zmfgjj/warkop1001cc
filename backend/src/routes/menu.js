const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/kategori', auth(), menuController.getKategori);
router.get('/', auth(), menuController.getMenu);
router.post('/', auth({ module: 'manajemen_menu', action: 'edit' }), upload.single('gambar'), menuController.tambahMenu);
router.put('/:id', auth({ module: 'manajemen_menu', action: 'edit' }), upload.single('gambar'), menuController.updateMenu);
router.delete('/:id', auth({ module: 'manajemen_menu', action: 'edit' }), menuController.hapusMenu);

module.exports = router;