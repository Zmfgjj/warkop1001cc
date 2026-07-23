const express = require('express');
const router = express.Router();
const crmController = require('../controllers/crmController');
const auth = require('../middleware/auth');

// Hanya bisa diakses oleh role yang memiliki permission 'crm' (view/edit)
router.get('/pelanggan', auth({ module: 'crm', action: 'view' }), crmController.getPelanggan);
// Local WhatsApp Gateway (whatsapp-web.js)
router.get('/wa-status', auth({ module: 'crm', action: 'view' }), crmController.getWaStatus);
router.post('/wa-logout', auth({ module: 'crm', action: 'edit' }), crmController.logoutWa);
router.post('/wa-toggle', auth({ module: 'crm', action: 'edit' }), crmController.toggleWa);
router.post('/broadcast-local', auth({ module: 'crm', action: 'edit' }), crmController.broadcastLocal);

module.exports = router;
