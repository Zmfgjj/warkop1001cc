const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const auth = require('../middleware/auth');

router.get('/ppn', auth(), settingsController.getPPN);
router.put('/ppn', auth(['owner', 'manager']), settingsController.setPPN);

module.exports = router;
