const express = require('express');
const router = express.Router();
const crmController = require('../controllers/crmController');
const auth = require('../middleware/auth');

// Hanya bisa diakses oleh role yang memiliki permission 'crm' (view/edit)
router.get('/pelanggan', auth({ module: 'crm', action: 'view' }), crmController.getPelanggan);
router.post('/broadcast', auth({ module: 'crm', action: 'edit' }), crmController.broadcastGateway);

// Local WhatsApp Gateway (whatsapp-web.js)
router.get('/wa-status', auth({ module: 'crm', action: 'view' }), crmController.getWaStatus);
router.post('/wa-logout', auth({ module: 'crm', action: 'edit' }), crmController.logoutWa);
router.post('/broadcast-local', auth({ module: 'crm', action: 'edit' }), crmController.broadcastLocal);

module.exports = router;
