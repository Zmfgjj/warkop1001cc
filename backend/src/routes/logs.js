const express = require('express');
const router = express.Router();
const logController = require('../controllers/logController');
const auth = require('../middleware/auth');

// All monitoring, logging, and rollback actions are restricted to Owner only
router.get('/activity', auth(['owner']), logController.getActivityLogs);
router.post('/restore/:id', auth(['owner']), logController.restoreLog);
router.get('/monitoring', auth(['owner']), logController.getSystemStatus);

module.exports = router;
