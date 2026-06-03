const express = require('express');
const router = express.Router();
const roleController = require('../controllers/roleController');
const auth = require('../middleware/auth');

// All role management routes require owner or manager
router.get('/', auth([]), roleController.getRoles);
router.get('/:id', auth([]), roleController.getRole);
router.post('/', auth([]), roleController.createRole);
router.put('/:id', auth([]), roleController.updateRole);
router.delete('/:id', auth([]), roleController.deleteRole);

module.exports = router;
