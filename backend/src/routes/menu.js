const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/kategori', menuController.getKategori);
router.get('/', menuController.getMenu);
router.post('/', auth(['owner', 'manager']), upload.single('gambar'), menuController.tambahMenu);
router.put('/:id', auth(['owner', 'manager']), upload.single('gambar'), menuController.updateMenu);
router.delete('/:id', auth(['owner', 'manager']), menuController.hapusMenu);

module.exports = router;