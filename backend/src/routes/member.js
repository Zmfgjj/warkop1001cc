const express = require('express');
const router = express.Router();
const memberController = require('../controllers/memberController');
const auth = require('../middleware/auth');

router.post('/register', auth({ module: 'crm', action: 'edit' }), memberController.registerMember);
router.get('/:no_hp', auth(), memberController.getMemberByPhone);
router.get('/', auth({ module: 'crm', action: 'view' }), memberController.getAllMembers);
router.get('/:id/history', auth({ module: 'crm', action: 'view' }), memberController.getMemberHistory);
router.put('/:id', auth({ module: 'crm', action: 'edit' }), memberController.updateMember);
router.delete('/:id', auth({ module: 'crm', action: 'edit' }), memberController.deleteMember);

module.exports = router;
