const express = require('express');
const router = express.Router();
const roleController = require('../controllers/roleController');
const auth = require('../middleware/auth');

// All role management routes require role_manage permissions
router.get('/', auth({ module: 'role_manage', action: 'view' }), roleController.getRoles);
router.get('/:id', auth({ module: 'role_manage', action: 'view' }), roleController.getRole);
router.post('/', auth({ module: 'role_manage', action: 'edit' }), roleController.createRole);
router.put('/:id', auth({ module: 'role_manage', action: 'edit' }), roleController.updateRole);
router.delete('/:id', auth({ module: 'role_manage', action: 'edit' }), roleController.deleteRole);

module.exports = router;
