const express = require('express');
const router = express.Router();
const logController = require('../controllers/logController');
const auth = require('../middleware/auth');

// All monitoring, logging, and rollback actions are restricted by logs_monitoring module
router.get('/activity', auth({ module: 'logs_monitoring', action: 'view' }), logController.getActivityLogs);
router.post('/restore/:id', auth({ module: 'logs_monitoring', action: 'edit' }), logController.restoreLog);
router.get('/monitoring', auth({ module: 'logs_monitoring', action: 'view' }), logController.getSystemStatus);
router.post('/clear-cache', auth({ module: 'logs_monitoring', action: 'edit' }), logController.clearServerCache);

module.exports = router;
